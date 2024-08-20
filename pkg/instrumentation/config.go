package instrumentation

import (
	contribsdkconfig "go.opentelemetry.io/contrib/config"
	"go.uber.org/zap/zapcore"
)

// Config holds the configuration for all instrumentation components.
type Config struct {
	Logs     LogsConfig    `mapstructure:"logs"`
	Traces   TracesConfig  `mapstructure:"traces"`
	Metrics  MetricsConfig `mapstructure:"metrics"`
	Resource Resource      `mapstructure:"resource"`
}

// Resource defines the configuration for OpenTelemetry resource attributes.
type Resource struct {
	Attributes contribsdkconfig.Attributes `mapstructure:"attributes"`
}

// LogsConfig holds the configuration for the logging component.
type LogsConfig struct {
	Enabled                         bool          `mapstructure:"enabled"`
	Level                           zapcore.Level `mapstructure:"level"`
	contribsdkconfig.LoggerProvider `mapstructure:",squash"`
}

// TracesConfig holds the configuration for the tracing component.
type TracesConfig struct {
	Enabled                         bool `mapstructure:"enabled"`
	contribsdkconfig.TracerProvider `mapstructure:",squash"`
}

// MetricsConfig holds the configuration for the metrics component.
type MetricsConfig struct {
	Enabled                        bool `mapstructure:"enabled"`
	contribsdkconfig.MeterProvider `mapstructure:",squash"`
}
