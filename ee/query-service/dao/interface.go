package dao

import (
	"context"
	"net/url"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"go.signoz.io/signoz/ee/query-service/model"
	basedao "go.signoz.io/signoz/pkg/query-service/dao"
	baseint "go.signoz.io/signoz/pkg/query-service/interfaces"
	basemodel "go.signoz.io/signoz/pkg/query-service/model"
)

type ModelDao interface {
	basedao.ModelDao

	// SetFlagProvider sets the feature lookup provider
	SetFlagProvider(flags baseint.FeatureLookup)

	DB() *sqlx.DB

	// auth methods
	CanUsePassword(ctx context.Context, email string) (bool, basemodel.BaseApiError)
	PrepareSsoRedirect(ctx context.Context, redirectUri, email string) (redirectURL string, apierr basemodel.BaseApiError)
	GetDomainFromSsoResponse(ctx context.Context, relayState *url.URL) (*model.OrgDomain, error)

	// org domain (auth domains) CRUD ops
	ListDomains(ctx context.Context, orgId string) ([]model.OrgDomain, basemodel.BaseApiError)
	GetDomain(ctx context.Context, id uuid.UUID) (*model.OrgDomain, basemodel.BaseApiError)
	CreateDomain(ctx context.Context, d *model.OrgDomain) basemodel.BaseApiError
	UpdateDomain(ctx context.Context, domain *model.OrgDomain) basemodel.BaseApiError
	DeleteDomain(ctx context.Context, id uuid.UUID) basemodel.BaseApiError
	GetDomainByEmail(ctx context.Context, email string) (*model.OrgDomain, basemodel.BaseApiError)

	CreatePAT(ctx context.Context, p model.PAT) (model.PAT, basemodel.BaseApiError)
	GetPAT(ctx context.Context, pat string) (*model.PAT, basemodel.BaseApiError)
	GetPATByID(ctx context.Context, id string) (*model.PAT, basemodel.BaseApiError)
	GetUserByPAT(ctx context.Context, token string) (*basemodel.UserPayload, basemodel.BaseApiError)
	ListPATs(ctx context.Context, userID string) ([]model.PAT, basemodel.BaseApiError)
	DeletePAT(ctx context.Context, id string) basemodel.BaseApiError
}
