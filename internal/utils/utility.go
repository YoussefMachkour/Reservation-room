// internal/utils/query.go
package utils

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// GetIntQuery gets an integer query parameter with a default value
func GetIntQuery(c *gin.Context, key string, defaultValue int) int {
	valueStr := c.Query(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}

	return value
}

// GetStringQuery gets a string query parameter with a default value
func GetStringQuery(c *gin.Context, key string, defaultValue string) string {
	value := c.Query(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetBoolQuery gets a boolean query parameter with a default value
func GetBoolQuery(c *gin.Context, key string, defaultValue bool) bool {
	valueStr := c.Query(key)
	if valueStr == "" {
		return defaultValue
	}

	// Handle common boolean representations
	valueStr = strings.ToLower(strings.TrimSpace(valueStr))

	switch valueStr {
	case "true", "1", "yes", "on":
		return true
	case "false", "0", "no", "off":
		return false
	default:
		// Try standard ParseBool as fallback
		value, err := strconv.ParseBool(valueStr)
		if err != nil {
			return defaultValue
		}
		return value
	}
}

// GetIntQueryWithValidation gets an integer query parameter with validation
func GetIntQueryWithValidation(c *gin.Context, key string, defaultValue, min, max int) int {
	value := GetIntQuery(c, key, defaultValue)

	if value < min {
		return min
	}
	if max > 0 && value > max {
		return max
	}

	return value
}

// GetStringSliceQuery gets a string slice from comma-separated query parameter
func GetStringSliceQuery(c *gin.Context, key string) []string {
	valueStr := c.Query(key)
	if valueStr == "" {
		return []string{}
	}

	// Handle both comma-separated and multiple query parameters
	values := c.QueryArray(key)
	if len(values) > 1 {
		return values
	}

	// Split comma-separated values
	return strings.Split(valueStr, ",")
}

// GetIntSliceQuery gets an integer slice from comma-separated query parameter
func GetIntSliceQuery(c *gin.Context, key string) []int {
	valueStr := c.Query(key)
	if valueStr == "" {
		return []int{}
	}

	// Split comma-separated values
	stringValues := strings.Split(valueStr, ",")
	intValues := make([]int, 0, len(stringValues))

	for _, str := range stringValues {
		if value, err := strconv.Atoi(strings.TrimSpace(str)); err == nil {
			intValues = append(intValues, value)
		}
	}

	return intValues
}

// ParseTimeQuery parses a time query parameter
func ParseTimeQuery(c *gin.Context, key string) (*time.Time, error) {
	valueStr := c.Query(key)
	if valueStr == "" {
		return nil, nil
	}

	parsedTime, err := time.Parse(time.RFC3339, valueStr)
	if err != nil {
		return nil, err
	}

	return &parsedTime, nil
}

// ValidatePagination validates and adjusts pagination parameters
func ValidatePagination(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

// CalculateOffset calculates the offset for pagination
func CalculateOffset(page, limit int) int {
	return (page - 1) * limit
}

// GetFloatQuery gets a float query parameter with a default value
func GetFloatQuery(c *gin.Context, key string, defaultValue float64) float64 {
	valueStr := c.Query(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		return defaultValue
	}

	return value
}

// GetBoolQueryStrict gets a boolean query parameter with strict validation
func GetBoolQueryStrict(c *gin.Context, key string, defaultValue bool) (bool, error) {
	valueStr := c.Query(key)
	if valueStr == "" {
		return defaultValue, nil
	}

	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		return defaultValue, err
	}

	return value, nil
}
