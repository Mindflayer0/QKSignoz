// Generate collector config for log pipelines
// using ottl targeting signoztransform processor.

package logparsingpipeline

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"go.signoz.io/signoz/pkg/query-service/queryBuilderToExpr"
)

func PreparePipelineProcessor(pipelines []Pipeline) (
	map[string]interface{}, []string, error,
) {
	processors := map[string]interface{}{}
	names := []string{}

	ottlStatements := []string{}

	for _, pipeline := range pipelines {
		if pipeline.Enabled {
			pipelineOttlStatements, err := ottlStatementsForPipeline(pipeline)
			if err != nil {
				return nil, nil, fmt.Errorf("couldn't generate ottl statements for pipeline %s: %w", pipeline.Alias, err)
			}

			ottlStatements = append(ottlStatements, pipelineOttlStatements...)
		}
	}

	// TODO(Raj): Maybe validate ottl statements
	if len(ottlStatements) > 0 {
		pipelinesProcessorName := "signoztransform/logs-pipelines"
		names = append(names, pipelinesProcessorName)
		processors[pipelinesProcessorName] = map[string]interface{}{
			"error_mode": "ignore",
			"log_statements": []map[string]interface{}{
				{
					"context":    "log",
					"statements": ottlStatements,
				},
			},
		}
	}

	// TODO(Raj): with error_mode: ignore, errors in ottl statements get logged and processing
	// continues on to the next statement.
	// So operators that get translated to multiple ottl statements must behave atomically
	// as much as possible - if a statement for the op fails, there is no point running the
	// statements that follow.

	return processors, names, nil
}

func ottlStatementsForPipeline(pipeline Pipeline) ([]string, error) {
	enabledOperators := []PipelineOperator{}
	for _, op := range pipeline.Config {
		if op.Enabled {
			enabledOperators = append(enabledOperators, op)
		}
	}
	if len(enabledOperators) < 1 {
		return []string{}, nil
	}

	// We are generating one or more ottl statements per pipeline operator.
	// ottl statements have individual where conditions per statement
	// The simplest path is to add where clause for pipeline filter to each statement.
	// However, this breaks if an early operator statement in the pipeline ends up
	// modifying the fields referenced in the pipeline filter.
	// To work around this, we add statements before and after the actual pipeline
	// operator statements, that add and remove a pipeline specific marker, ensuring
	// all operators in a pipeline get to act on the log even if an op changes the filter referenced fields.
	pipelineMarker := fmt.Sprintf(
		"%s-%s", pipeline.Alias, pipeline.Id, // pipeline.Id is guaranteed to be unique by DB.
	)

	addPipelineMarkerOttlStmt := fmt.Sprintf(
		`set(attributes["__matched-log-pipeline__"], "%s")`, pipelineMarker,
	)

	filterExpr, err := queryBuilderToExpr.Parse(pipeline.Filter)
	if err != nil {
		return nil, fmt.Errorf("failed to parse pipeline filter: %w", err)
	}
	if len(filterExpr) > 0 {
		// TODO(Raj): Update qb2Expr logic to work directly with ottl
		filterOttl := exprToOttl(filterExpr)
		addPipelineMarkerOttlStmt += fmt.Sprintf(" where %s", filterOttl)
	}

	pipelineOttlStatements := []string{addPipelineMarkerOttlStmt}

	// Add ottl statements for implementing enabled pipeline operators

	logMatchesPipeline := fmt.Sprintf(
		`attributes["__matched-log-pipeline__"] == "%s"`, pipelineMarker,
	)

	for _, operator := range enabledOperators {
		stmts, err := ottlStatementsForPipelineOperator(operator)
		if err != nil {
			return nil, fmt.Errorf(
				"couldn't generate ottl for %s operator: %w", operator.Type, err,
			)
		}

		for _, s := range stmts {
			// prepend pipeline marker check to operator ottl statement conditions
			s.conditions = append([]string{logMatchesPipeline}, s.conditions...)
			pipelineOttlStatements = append(pipelineOttlStatements, s.toString())
		}
	}

	// Add a final ottl statement for the pipeline for removing pipeline marker
	removePipelineMarkerFromMatchingLogs := fmt.Sprintf(
		`delete_key(attributes, "__matched-log-pipeline__") where %s`, logMatchesPipeline,
	)
	pipelineOttlStatements = append(
		pipelineOttlStatements, removePipelineMarkerFromMatchingLogs,
	)

	return pipelineOttlStatements, nil
}

// Operator specific ottl generation helpers follow

// struct for helping put ottl statements together
type ottlStatement struct {
	// All ottl statements have exactly 1 "editor" for transforming log
	editor string
	// editor only gets applied if a log matches the condition
	// `conditions` get joined with `AND` when being rendered to final ottl statements
	conditions []string
}

func (s *ottlStatement) toString() string {
	if len(s.conditions) < 1 {
		return s.editor
	}

	conditions := []string{}
	for _, c := range s.conditions {
		if len(c) > 0 {
			conditions = append(conditions, c)
		}
	}

	return fmt.Sprintf(
		"%s where %s", s.editor, strings.Join(conditions, " and "),
	)
}

func ottlStatementsForPipelineOperator(operator PipelineOperator) (
	[]ottlStatement, error,
) {

	if operator.Type == "add" {
		return ottlStatementsForAddOperator((operator))

	} else if operator.Type == "remove" {
		return ottlStatementsForRemoveOperator((operator))

	} else if operator.Type == "copy" {
		return ottlStatementsForCopyOperator((operator))

	} else if operator.Type == "move" {
		return ottlStatementsForMoveOperator((operator))

	} else if operator.Type == "regex_parser" {
		return ottlStatementsForRegexParser(operator)

	} else if operator.Type == "grok_parser" {
		return ottlStatementsForGrokParser(operator)

	} else if operator.Type == "json_parser" {
		return ottlStatementsForJsonParser(operator)

	} else if operator.Type == "time_parser" {
		return ottlStatementsForTimeParser(operator)

	} else if operator.Type == "severity_parser" {
		return ottlStatementsForSeverityParser(operator)

	} else if operator.Type == "trace_parser" {
		return ottlStatementsForTraceParser(operator)

	}

	return nil, fmt.Errorf("unsupported pipeline operator type: %s", operator.Type)
}

func ottlStatementsForAddOperator(
	operator PipelineOperator,
) ([]ottlStatement, error) {
	conditions := []string{}
	value := fmt.Sprintf(`"%s"`, operator.Value)

	// Handling for adding dynamic values using golang expr as allowed by logstransform add operator
	// See https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/pkg/stanza/operator/transformer/add/transformer.go#L49
	// Expression values are enclosed in `EXPR(...)`. Note that only uppercase `EXPR(...)` is supported
	if strings.HasPrefix(operator.Value, "EXPR(") {
		expression := strings.TrimSuffix(strings.TrimPrefix(operator.Value, "EXPR("), ")")
		value = exprToOttl(expression)

		// Also add non-nil check condition for fields referenced in the value expression
		fieldsNotNilCheck, err := fieldsReferencedInExprNotNilCheck(expression)
		if err != nil {
			return nil, fmt.Errorf(
				"couldn't generate nil check for fields referenced in value expr of add operator %s: %w",
				operator.Name, err,
			)
		}
		if fieldsNotNilCheck != "" {
			conditions = append(conditions, exprToOttl(fieldsNotNilCheck))
		}
	}

	return []ottlStatement{{
		editor:     fmt.Sprintf(`set(%s, %s)`, logTransformPathToOttlPath(operator.Field), value),
		conditions: conditions,
	}}, nil
}

func ottlStatementsForRemoveOperator(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	stmt, err := ottlStatementForDeletingField(operator.Field)
	if err != nil {
		return nil, fmt.Errorf("couldn't generate ottl for remove operator: %w", err)
	}
	return []ottlStatement{*stmt}, nil
}

func ottlStatementsForCopyOperator(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	return []ottlStatement{{
		editor: fmt.Sprintf(
			`set(%s, %s)`,
			logTransformPathToOttlPath(operator.To),
			logTransformPathToOttlPath(operator.From),
		),
		// TODO(Raj): What if operator.From is nil? Add a test
		conditions: []string{},
	}}, nil
}

func ottlStatementsForMoveOperator(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	stmts := []ottlStatement{{
		editor: fmt.Sprintf(
			`set(%s, %s)`,
			logTransformPathToOttlPath(operator.To),
			logTransformPathToOttlPath(operator.From),
		),
		// TODO(Raj): What happens if operatore.From is nil here.
		conditions: []string{},
	}}

	deleteStmt, err := ottlStatementForDeletingField(operator.From)
	if err != nil {
		return nil, fmt.Errorf("couldn't generate delete stmt for move op: %w", err)
	}
	stmts = append(stmts, *deleteStmt)

	return stmts, nil
}

func ottlStatementsForRegexParser(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	parseFromNotNilCheck, err := fieldNotNilCheck(operator.ParseFrom)
	if err != nil {
		return nil, fmt.Errorf(
			"couldn't generate nil check for parseFrom of regex op %s: %w", operator.Name, err,
		)
	}

	// TODO(Raj): What happens if ParseTo is not a map? Add a test for this
	return []ottlStatement{{
		editor: fmt.Sprintf(
			`merge_maps(%s, ExtractPatterns(%s, "%s"), "upsert")`,
			logTransformPathToOttlPath(operator.ParseTo),
			logTransformPathToOttlPath(operator.ParseFrom),
			escapeDoubleQuotesForOttl(operator.Regex),
		),
		conditions: []string{exprToOttl(parseFromNotNilCheck)},
	}}, nil

}

func ottlStatementsForGrokParser(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	parseFromNotNilCheck, err := fieldNotNilCheck(operator.ParseFrom)
	if err != nil {
		return nil, fmt.Errorf(
			"couldn't generate nil check for parseFrom of grok op %s: %w", operator.Name, err,
		)
	}
	// TODO(Raj): What happens if ParseTo is not a map? Add a test for this
	return []ottlStatement{{
		editor: fmt.Sprintf(
			`merge_maps(%s, GrokParse(%s, "%s"), "upsert")`,
			logTransformPathToOttlPath(operator.ParseTo),
			logTransformPathToOttlPath(operator.ParseFrom),
			escapeDoubleQuotesForOttl(operator.Pattern),
		),
		conditions: []string{exprToOttl(parseFromNotNilCheck)},
	}}, nil
}

func ottlStatementsForJsonParser(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	parseFromNotNilCheck, err := fieldNotNilCheck(operator.ParseFrom)
	if err != nil {
		return nil, fmt.Errorf(
			"couldn't generate nil check for parseFrom of json parser op %s: %w", operator.Name, err,
		)
	}

	mapExtractStmts := ottlStatementsForExtractingMapValue(
		fmt.Sprintf("ParseJSON(%s)", logTransformPathToOttlPath(operator.ParseFrom)),
		logTransformPathToOttlPath(operator.ParseTo),
	)

	stmts := ottlStatementsWithPrependedConditions(
		mapExtractStmts,
		exprToOttl(parseFromNotNilCheck),
		fmt.Sprintf(
			`IsMatch(%s, "^\\s*{.*}\\s*$")`,
			logTransformPathToOttlPath(operator.ParseFrom),
		),
	)

	return stmts, nil
}

func ottlStatementsForTimeParser(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	stmts := []ottlStatement{}

	parseFromNotNilCheck, err := fieldNotNilCheck(operator.ParseFrom)
	if err != nil {
		return nil, fmt.Errorf(
			"couldn't generate nil check for parseFrom of json parser op %s: %w", operator.Name, err,
		)
	}

	whereClauseParts := []string{exprToOttl(parseFromNotNilCheck)}

	if operator.LayoutType == "strptime" {
		regex, err := RegexForStrptimeLayout(operator.Layout)
		if err != nil {
			return nil, fmt.Errorf(
				"couldn't generate layout regex for time_parser %s: %w", operator.Name, err,
			)
		}
		whereClauseParts = append(whereClauseParts,
			fmt.Sprintf(`IsMatch(%s, "%s")`, logTransformPathToOttlPath(operator.ParseFrom), regex),
		)

		stmts = append(stmts, ottlStatement{
			editor: fmt.Sprintf(
				`set(time, Time(%s, "%s"))`,
				logTransformPathToOttlPath(operator.ParseFrom),
				operator.Layout,
			),
			conditions: whereClauseParts,
		})

	} else if operator.LayoutType == "epoch" {
		valueRegex := `^\\s*[0-9]+\\s*$`
		if strings.Contains(operator.Layout, ".") {
			valueRegex = `^\\s*[0-9]+\\.[0-9]+\\s*$`
		}

		whereClauseParts = append(whereClauseParts,
			exprToOttl(fmt.Sprintf(
				`string(%s) matches "%s"`, operator.ParseFrom, valueRegex,
			)),
		)

		timeValue := fmt.Sprintf("Double(%s)", logTransformPathToOttlPath(operator.ParseFrom))
		if strings.HasPrefix(operator.Layout, "seconds") {
			timeValue = fmt.Sprintf("%s * 1000000000", timeValue)
		} else if operator.Layout == "milliseconds" {
			timeValue = fmt.Sprintf("%s * 1000000", timeValue)
		} else if operator.Layout == "microseconds" {
			timeValue = fmt.Sprintf("%s * 1000", timeValue)
		}
		stmts = append(stmts, ottlStatement{
			editor:     fmt.Sprintf(`set(time_unix_nano, %s)`, timeValue),
			conditions: whereClauseParts,
		})
	} else {
		return nil, fmt.Errorf("unsupported time layout %s", operator.LayoutType)
	}

	return stmts, nil
}

func ottlStatementsForSeverityParser(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	stmts := []ottlStatement{}

	parseFromNotNilCheck, err := fieldNotNilCheck(operator.ParseFrom)
	if err != nil {
		return nil, fmt.Errorf(
			"couldn't generate nil check for parseFrom of severity parser %s: %w", operator.Name, err,
		)
	}

	for severity, valuesToMap := range operator.SeverityMapping {
		for _, value := range valuesToMap {
			// Special case for 2xx 3xx 4xx and 5xx
			isSpecialValue, err := regexp.MatchString(`^\s*[2|3|4|5]xx\s*$`, strings.ToLower(value))
			if err != nil {
				return nil, fmt.Errorf("couldn't regex match for wildcard severity values: %w", err)
			}
			if isSpecialValue {
				whereClause := strings.Join([]string{
					exprToOttl(parseFromNotNilCheck),
					exprToOttl(fmt.Sprintf(`type(%s) in ["int", "float"] && %s == float(int(%s))`, operator.ParseFrom, operator.ParseFrom, operator.ParseFrom)),
					exprToOttl(fmt.Sprintf(`string(int(%s)) matches "^%s$"`, operator.ParseFrom, fmt.Sprintf("%s[0-9]{2}", value[0:1]))),
				}, " and ")
				stmts = append(stmts, ottlStatement{
					editor:     fmt.Sprintf("set(severity_number, SEVERITY_NUMBER_%s)", strings.ToUpper(severity)),
					conditions: []string{whereClause},
				})
				stmts = append(stmts, ottlStatement{
					editor:     fmt.Sprintf(`set(severity_text, "%s")`, strings.ToUpper(severity)),
					conditions: []string{whereClause},
				})
			} else {
				whereClause := strings.Join([]string{
					exprToOttl(parseFromNotNilCheck),
					fmt.Sprintf(
						`IsString(%s)`,
						logTransformPathToOttlPath(operator.ParseFrom),
					),
					fmt.Sprintf(
						`IsMatch(%s, "^\\s*%s\\s*$")`,
						logTransformPathToOttlPath(operator.ParseFrom), value,
					),
				}, " and ")

				stmts = append(stmts, ottlStatement{
					editor:     fmt.Sprintf("set(severity_number, SEVERITY_NUMBER_%s)", strings.ToUpper(severity)),
					conditions: []string{whereClause},
				})
				stmts = append(stmts, ottlStatement{
					editor:     fmt.Sprintf(`set(severity_text, "%s")`, strings.ToUpper(severity)),
					conditions: []string{whereClause},
				})
			}
		}
	}

	return stmts, nil
}

func ottlStatementsForTraceParser(operator PipelineOperator) (
	[]ottlStatement, error,
) {
	stmts := []ottlStatement{}

	if operator.TraceId != nil && len(operator.TraceId.ParseFrom) > 0 {
		parseFromNotNilCheck, err := fieldNotNilCheck(operator.TraceId.ParseFrom)
		if err != nil {
			return nil, fmt.Errorf(
				"couldn't generate nil check for TraceId.parseFrom %s: %w", operator.Name, err,
			)
		}
		// TODO(Raj): Also check for trace id regex pattern
		stmts = append(stmts, ottlStatement{
			editor:     fmt.Sprintf(`set(trace_id.string, %s)`, logTransformPathToOttlPath(operator.TraceId.ParseFrom)),
			conditions: []string{exprToOttl(parseFromNotNilCheck)},
		})
	}

	if operator.SpanId != nil && len(operator.SpanId.ParseFrom) > 0 {
		parseFromNotNilCheck, err := fieldNotNilCheck(operator.SpanId.ParseFrom)
		if err != nil {
			return nil, fmt.Errorf(
				"couldn't generate nil check for TraceId.parseFrom %s: %w", operator.Name, err,
			)
		}
		// TODO(Raj): Also check for span id regex pattern
		stmts = append(stmts, ottlStatement{
			editor:     fmt.Sprintf("set(span_id.string, %s)", logTransformPathToOttlPath(operator.SpanId.ParseFrom)),
			conditions: []string{exprToOttl(parseFromNotNilCheck)},
		})

	}

	if operator.TraceFlags != nil && len(operator.TraceFlags.ParseFrom) > 0 {

		parseFromNotNilCheck, err := fieldNotNilCheck(operator.TraceFlags.ParseFrom)
		if err != nil {
			return nil, fmt.Errorf(
				"couldn't generate nil check for TraceId.parseFrom %s: %w", operator.Name, err,
			)
		}
		// TODO(Raj): Also check for trace flags hex regex pattern
		stmts = append(stmts, ottlStatement{
			editor:     fmt.Sprintf(`set(flags, HexToInt(%s))`, logTransformPathToOttlPath(operator.TraceFlags.ParseFrom)),
			conditions: []string{exprToOttl(parseFromNotNilCheck)},
		})
	}
	return stmts, nil
}

// TODO(Raj): This should be used in regex and grok parser too?
func ottlStatementsForExtractingMapValue(
	mapGenerator string,
	target string,
) []ottlStatement {
	stmts := []ottlStatement{}

	cacheKey := uuid.NewString()

	// Extract parsed map to cache.
	stmts = append(stmts, ottlStatement{
		editor: fmt.Sprintf(
			`set(cache["%s"], %s)`, cacheKey, mapGenerator,
		),
		conditions: []string{},
	})

	// Set target to a map if not already one.
	stmts = append(stmts, ottlStatement{
		editor: fmt.Sprintf(
			`set(%s, ParseJSON("{}"))`, logTransformPathToOttlPath(target),
		),
		conditions: []string{
			fmt.Sprintf(`cache["%s"] != nil`, cacheKey),
			fmt.Sprintf("not IsMap(%s)", logTransformPathToOttlPath(target)),
		},
	})

	stmts = append(stmts, ottlStatement{
		editor: fmt.Sprintf(
			`merge_maps(%s, cache["%s"], "upsert")`,
			logTransformPathToOttlPath(target), cacheKey,
		),
		conditions: []string{fmt.Sprintf(`cache["%s"] != nil`, cacheKey)},
	})

	return stmts
}

func ottlStatementForDeletingField(fieldPath string) (*ottlStatement, error) {
	ottlPath := logTransformPathToOttlPath(fieldPath)
	fieldPathParts := rSplitAfterN(ottlPath, "[", 2)
	target := fieldPathParts[0]
	key := fieldPathParts[1][1 : len(fieldPathParts[1])-1]

	pathNotNilCheck, err := fieldNotNilCheck(fieldPath)
	if err != nil {
		return nil, fmt.Errorf("couldn't generate nil check for path %s: %w", fieldPath, err)
	}

	return &ottlStatement{
		editor:     fmt.Sprintf(`delete_key(%s, %s)`, target, key),
		conditions: []string{exprToOttl(pathNotNilCheck)},
	}, nil
}

// a.b?.c -> ["a", "b", "c"]
// a.b["c.d"].e -> ["a", "b", "c.d", "e"]
func pathParts(path string) []string {
	path = strings.ReplaceAll(path, "?.", ".")

	// Split once from the right to include the rightmost membership op and everything after it.
	// Eg: `attributes.test["a.b"].value["c.d"].e` would result in `attributes.test["a.b"].value` and `["c.d"].e`
	memberOpParts := rSplitAfterN(path, "[", 2)

	if len(memberOpParts) < 2 {
		// there is no [] access in fieldPath
		return strings.Split(path, ".")
	}

	// recursively get parts for path prefix before rightmost membership op (`attributes.test["a.b"].value`)
	parts := pathParts(memberOpParts[0])

	suffixParts := strings.SplitAfter(memberOpParts[1], "]") // ["c.d"].e -> `["c.d"]`, `.e`

	// add key used in membership op ("c.d")
	parts = append(parts, suffixParts[0][2:len(suffixParts[0])-2])

	// add parts for path after the membership op ("e")
	if len(suffixParts[1]) > 0 {
		parts = append(parts, strings.Split(suffixParts[1][1:], ".")...)
	}

	return parts
}

// converts a logtransform path to an equivalent ottl path
// For details, see https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/pkg/ottl/contexts/ottllog#paths
func logTransformPathToOttlPath(path string) string {
	if !(strings.HasPrefix(path, "attributes") || strings.HasPrefix(path, "resource")) {
		return path
	}

	parts := pathParts(path)

	ottlPathParts := []string{parts[0]}

	if ottlPathParts[0] == "resource" {
		ottlPathParts[0] = "resource.attributes"
	}

	for _, p := range parts[1:] {
		ottlPathParts = append(ottlPathParts, fmt.Sprintf(`["%s"]`, p))
	}

	return strings.Join(ottlPathParts, "")
}

func escapeDoubleQuotesForOttl(str string) string {
	return strings.ReplaceAll(
		strings.ReplaceAll(str, `\`, `\\`), `"`, `\"`,
	)
}

func exprToOttl(expr string) string {
	return fmt.Sprintf(`EXPR("%s")`, escapeDoubleQuotesForOttl(expr))
}

func ottlStatementsWithPrependedConditions(
	statements []ottlStatement,
	conditionsToPrepend ...string,
) []ottlStatement {
	stmts := []ottlStatement{}
	for _, s := range statements {
		stmts = append(stmts, ottlStatement{
			editor: s.editor,
			conditions: append(
				conditionsToPrepend, s.conditions...,
			),
		})
	}
	return stmts
}
