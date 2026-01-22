package utils

import (
	"time"

	"github.com/spf13/viper"
)

// Config structure stores all configurations of the application, read by viper
type Config struct {
	Port               string        `mapstructure:"PORT"`
	DBSource           string        `mapstructure:"DB_SOURCE"`
	GoogleClientID     string        `mapstructure:"GOOGLE_CLIENT_ID"`
	GoogleClientSecret string        `mapstructure:"GOOGLE_CLIENT_SECRET"`
	GoogleRedirectURL  string        `mapstructure:"GOOGLE_REDIRECT_URL"`
	RefreshTokenKey    string        `mapstructure:"REFRESH_TOKEN_KEY"`
	RefreshTokenTime   time.Duration `mapstructure:"REFRESH_TOKEN_TIME"`
	AccessTokenKey     string        `mapstructure:"ACCESS_TOKEN_KEY"`
	AccessTokenTime    time.Duration `mapstructure:"ACCESS_TOKEN_TIME"`
	SecureCookies      bool          `mapstructure:"SECURE_COOKIES"`
	Website            string        `mapstructure:"WEBSITE"`
	Domain             string        `mapstructure:"DOMAIN"`

	// S3
	BucketName            string `mapstructure:"BUCKET_NAME"`
	AWS_REGION            string `mapstructure:"AWS_REGION"`
	AWS_ACCESS_KEY_ID     string `mapstructure:"AWS_ACCESS_KEY_ID"`
	AWS_SECRET_ACCESS_KEY string `mapstructure:"AWS_SECRET_ACCESS_KEY"`
}

// LoadConfig reads configuration from environment variables
func LoadConfig() (config Config, err error) {

	viper.AddConfigPath(".")
	viper.SetConfigName(".env")
	viper.SetConfigType("env")

	// Read .env
	viper.AutomaticEnv()
	if err := viper.ReadInConfig(); err != nil {
		return Config{}, err
	}

	// Unmarshal .env to struct
	if err := viper.Unmarshal(&config); err != nil {
		return Config{}, err
	}

	return config, nil
}
