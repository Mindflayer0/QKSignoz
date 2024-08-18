package http

import "github.com/spf13/pflag"

type Config struct {
	ListenAddress string
}

func (cfg *Config) RegisterFlags(pf *pflag.FlagSet) {
	pf.StringVar(&cfg.ListenAddress, "http.listen-address", "0.0.0.0:8080", "Listen address of the http server.")
}
