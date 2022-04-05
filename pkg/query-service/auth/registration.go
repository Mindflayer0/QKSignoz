package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/pkg/errors"
	"go.signoz.io/query-service/constants"
	"go.signoz.io/query-service/dao"
	"go.signoz.io/query-service/model"
)

// We should be able to invite a user to create an account on SigNoz.
// The invitation is generic i.e. It is always for non-root user. If a user wants admin access
// then an admin can add him to admin group after registration.

// Invitation claim will contain emailID, and while registration user will be able to create
// an account with this email only.

const (
	inviteValidity = 24 * time.Hour
)

type InviteRequest struct {
	Email string `json:"email"`
}

type InviteResponse struct {
	Email       string `json:"email"`
	InviteToken string `json:"inviteToken"`
}

type User struct {
	ID       string
	Email    string
	Password string
	Groups   []Group
}

// The root user should be able to invite people to create account on SigNoz cluster.
func Invite(ctx context.Context, req *InviteRequest) (*InviteResponse, error) {
	if err := authenticateRootUser(ctx); err != nil {
		return nil, err
	}

	token, err := generateInviteJwt(req)
	if err != nil {
		return nil, err
	}
	return &InviteResponse{req.Email, token}, nil
}

func authenticateRootUser(ctx context.Context) error {
	token, err := ExtractJwt(ctx)
	if err != nil {
		return err
	}

	user, err := validateToken(token)
	if err != nil {
		return errors.Wrap(err, "unable to parse JWT token")
	}

	if user.Email != constants.RootUserEmail {
		return errors.New("Failed to authenticate root user")
	}
	return nil
}

func validateInvite(req *RegisterRequest) error {
	claims, err := ParseJWT(req.InviteToken)
	if err != nil {
		return err
	}
	if claims["email"] != req.Email {
		return fmt.Errorf("Invalid invite token")
	}
	return nil
}

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	InviteToken string `json: "token"`
}

func Register(ctx context.Context, req *RegisterRequest) *model.ApiError {
	if err := validateInvite(req); err != nil {
		return &model.ApiError{
			Err: err,
			Typ: model.ErrorUnauthorized,
		}
	}

	hash, err := passwordHash(req.Password)
	if err != nil {
		return &model.ApiError{
			Err: err,
			Typ: model.ErrorUnauthorized,
		}
	}
	return dao.DB().CreateNewUser(ctx, &model.UserParams{
		Email:    req.Email,
		Password: hash,
	})
}
