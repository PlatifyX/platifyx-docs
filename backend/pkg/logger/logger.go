package logger

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Logger struct {
	*zap.SugaredLogger
}

func NewLogger(environment string) *Logger {
	var zapLogger *zap.Logger
	var err error

	if environment == "production" {
		config := zap.NewProductionConfig()
		config.EncoderConfig.TimeKey = "timestamp"
		config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
		zapLogger, err = config.Build()
	} else {
		config := zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		zapLogger, err = config.Build()
	}

	if err != nil {
		panic(err)
	}

	return &Logger{
		SugaredLogger: zapLogger.Sugar(),
	}
}
