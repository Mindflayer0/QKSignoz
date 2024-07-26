package auth

import (
	"context"
	"fmt"
	"net/http"
	"time"

	jwtmiddleware "github.com/auth0/go-jwt-middleware"
	"github.com/golang-jwt/jwt"
	"github.com/pkg/errors"
	"go.signoz.io/signoz/pkg/query-service/model"
	"go.uber.org/zap"
)

var (
	JwtSecret  string
	JwtExpiry  = 30 * time.Minute
	JwtRefresh = 30 * 24 * time.Hour
)

func ParseJWT(jwtStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(jwtStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.Errorf("unknown signing algo: %v", token.Header["alg"])
		}
		return []byte(JwtSecret), nil
	})

	if err != nil {
		return nil, errors.Wrapf(err, "failed to parse jwt token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.Errorf("Not a valid jwt claim")
	}

	// the function validateUser panics to convert claims["orgId"] to string as the jwt.Parse doesn't check for claims. 
	// the function jwt.ParseWithClaims does check for custom claims. 
	// TODO[@vikrantgupta25] : to update this to the claims check function for better integrity of JWT
	if claims["orgId"] != nil {
		return nil, errors.Errorf("Org Id is missing in the claim")
	}
	return claims, nil
}

func validateUser(tok string) (*model.UserPayload, error) {
	claims, err := ParseJWT(tok)
	if err != nil {
		return nil, err
	}
	now := time.Now().Unix()
	if !claims.VerifyExpiresAt(now, true) {
		return nil, model.ErrorTokenExpired
	}
	return &model.UserPayload{
		User: model.User{
			Id:      claims["id"].(string),
			GroupId: claims["gid"].(string),
			Email:   claims["email"].(string),
			OrgId:   claims["orgId"].(string),
		},
	}, nil
}

// AttachJwtToContext attached the jwt token from the request header to the context.
func AttachJwtToContext(ctx context.Context, r *http.Request) context.Context {
	token, err := ExtractJwtFromRequest(r)
	if err != nil {
		zap.L().Error("Error while getting token from header", zap.Error(err))
		return ctx
	}

	return context.WithValue(ctx, AccessJwtKey, token)
}

func ExtractJwtFromContext(ctx context.Context) (string, bool) {
	jwtToken, ok := ctx.Value(AccessJwtKey).(string)
	return jwtToken, ok
}

func ExtractJwtFromRequest(r *http.Request) (string, error) {
	return jwtmiddleware.FromAuthHeader(r)
}

func ExtractUserIdFromContext(ctx context.Context) (string, error) {
	userId := ""
	jwt, ok := ExtractJwtFromContext(ctx)
	if !ok {
		return "", model.InternalError(fmt.Errorf("failed to extract jwt from context"))
	}

	claims, err := ParseJWT(jwt)
	if err != nil {
		return "", model.InternalError(fmt.Errorf("failed get claims from jwt %v", err))
	}

	if v, ok := claims["id"]; ok {
		userId = v.(string)
	}
	return userId, nil
}

func GetEmailFromJwt(ctx context.Context) (string, error) {
	jwt, ok := ExtractJwtFromContext(ctx)
	if !ok {
		return "", model.InternalError(fmt.Errorf("failed to extract jwt from context"))
	}

	claims, err := ParseJWT(jwt)
	if err != nil {
		return "", model.InternalError(fmt.Errorf("failed get claims from jwt %v", err))
	}

	return claims["email"].(string), nil
}
