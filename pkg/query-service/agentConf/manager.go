package agentConf

import (
	"context"
	"fmt"
	"sync/atomic"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/open-telemetry/opentelemetry-collector-contrib/processor/filterprocessor"
	tsp "github.com/open-telemetry/opentelemetry-collector-contrib/processor/tailsamplingprocessor"
	"go.signoz.io/signoz/pkg/query-service/app/opamp"
	"go.uber.org/zap"
)

var m *Manager

func init() {
	m = &Manager{}
}

type Manager struct {
	Repo
	// lock to make sure only one update is sent to remote agents at a time
	lock uint32
}

// Ready indicates if Manager can accept new config update requests
func (mgr *Manager) Ready() bool {
	return mgr.lock == 0
}

func Initiate(db *sqlx.DB, engine string) error {
	m.Repo = Repo{db}
	return m.initDB(engine)
}

// Ready indicates if Manager can accept new config update requests
func Ready() bool {
	return m.Ready()
}

func GetLatestVersion(ctx context.Context, elementType ElementTypeDef) (*ConfigVersion, error) {
	return m.GetLatestVersion(ctx, elementType)
}

func GetConfigVersion(ctx context.Context, elementType ElementTypeDef, version int) (*ConfigVersion, error) {
	return m.GetConfigVersion(ctx, elementType, version)
}

func GetConfigHistory(ctx context.Context, typ ElementTypeDef) ([]ConfigVersion, error) {
	return m.GetConfigHistory(ctx, typ)
}

// StartNewVersion launches a new config version for given set of elements
func StartNewVersion(ctx context.Context, eleType ElementTypeDef, elementIds []string) (*ConfigVersion, error) {

	if !m.Ready() {
		// agent is already being updated, ask caller to wait and re-try after sometime
		return nil, fmt.Errorf("agent updater is busy")
	}

	// create a new version
	cfg := NewConfigversion(eleType)

	// insert new config and elements into database
	err := m.insertConfig(ctx, cfg, elementIds)
	if err != nil {
		return nil, err
	}

	return cfg, nil
}

// UpsertFilterProcessor updates the agent config with new filter processor params
func UpsertFilterProcessor(key string, config *filterprocessor.Config) error {
	if !atomic.CompareAndSwapUint32(&m.lock, 0, 1) {
		return fmt.Errorf("agent updater is busy")
	}
	defer atomic.StoreUint32(&m.lock, 0)

	// merge current config with new filter params
	return nil
}

// UpsertSamplingProcessor updates the agent config with new filter processor params
func UpsertSamplingProcessor(ctx context.Context, version int, key string, config *tsp.Config) error {
	if !atomic.CompareAndSwapUint32(&m.lock, 0, 1) {
		return fmt.Errorf("agent updater is busy")
	}
	defer atomic.StoreUint32(&m.lock, 0)

	// merge current config with new filter params
	processorConf := map[string]interface{}{
		"tail_sampling": config,
	}

	configHash, err := opamp.UpsertTraceProcessors(ctx, []interface{}{processorConf})
	if err != nil {
		zap.S().Errorf("failed to call agent config update for trace processor:", err)
		return err
	}

	// we wait for a minute or exit as UI will be waiting
	done := make(chan int, 1)
	ticker := time.NewTicker(1 * time.Second)

	onUpdate := func(hash string, err error) {
		if hash == configHash {
			if err != nil {
				m.updateDeployStatus(ctx, version, string(DeployFailed), err.Error())
			} else {
				m.updateDeployStatus(ctx, version, string(Deployed), "deploy successful")
			}
			close(done)
		}
	}

	go opamp.Subscribe(configHash, onUpdate)

	for {
		select {
		case <-done:
			return nil
		case <-ticker.C:
			return fmt.Errorf("operation timed out")
		}
	}

}
