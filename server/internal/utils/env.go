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
	RefreshTokenKey    string        `mapstructure:"REFRESH_TOKEN_KEY"`
	RefreshTokenTime   time.Duration `mapstructure:"REFRESH_TOKEN_TIME"`
	AccessTokenKey     string        `mapstructure:"ACCESS_TOKEN_KEY"`
	AccessTokenTime    time.Duration `mapstructure:"ACCESS_TOKEN_TIME"`
	SecureCookies      bool          `mapstructure:"SECURE_COOKIES"`
	Website            string        `mapstructure:"WEBSITE"`
	Domain             string        `mapstructure:"DOMAIN"`
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
