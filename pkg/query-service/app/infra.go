package app

import (
	"encoding/json"
	"net/http"

	"go.signoz.io/signoz/pkg/query-service/model"
	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
)

func (aH *APIHandler) getHostAttributeKeys(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := v3.FilterAttributeKeyRequest{}

	// parse request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// get attribute keys
	keys, err := aH.hostsRepo.GetHostAttributeKeys(ctx, req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// write response
	aH.Respond(w, keys)
}

func (aH *APIHandler) getHostAttributeValues(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := v3.FilterAttributeValueRequest{}

	// parse request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// get attribute values
	values, err := aH.hostsRepo.GetHostAttributeValues(ctx, req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// write response
	aH.Respond(w, values)
}

func (aH *APIHandler) getHostList(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := model.HostListRequest{}

	// parse request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// get host list
	hostList, err := aH.hostsRepo.GetHostList(ctx, req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// write response
	aH.Respond(w, hostList)
}

func (aH *APIHandler) getProcessAttributeKeys(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := v3.FilterAttributeKeyRequest{}

	// parse request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// get attribute keys
	keys, err := aH.processesRepo.GetProcessAttributeKeys(ctx, req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// write response
	aH.Respond(w, keys)
}

func (aH *APIHandler) getProcessAttributeValues(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := v3.FilterAttributeValueRequest{}

	// parse request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// get attribute values
	values, err := aH.processesRepo.GetProcessAttributeValues(ctx, req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// write response
	aH.Respond(w, values)
}

func (aH *APIHandler) getProcesses(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	req := model.ProcessesListRequest{}

	// parse request
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// get processes
	processes, err := aH.processesRepo.GetProcesses(ctx, req)
	if err != nil {
		RespondError(w, &model.ApiError{Typ: model.ErrorInternal, Err: err}, nil)
		return
	}

	// write response
	aH.Respond(w, processes)
}
