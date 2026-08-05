package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
	// Load config
	// TODO: cfg, _ := config.Load()

	// Setup structured logger
	// TODO: logger, _ := zap.NewProduction()

	// Create gRPC server
	srv := grpc.NewServer(
		// TODO: grpc.StatsHandler(opentelemetry.NewServerHandler()),
		// TODO: grpc.UnaryInterceptor(logging.Unary(logger)),
	)

	// TODO: Register services
	// pb.RegisterAuthService(srv, authServer)
	// pb.RegisterUserService(srv, userServer)

	// Health check
	healthServer := health.NewServer()
	healthServer.SetServingStatus("", "SERVING")
	healthpb.RegisterHealthServer(srv, healthServer)

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down gRPC server...")
		srv.GracefulStop()
	}()

	// Start server
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen on :50051: %v", err)
	}

	log.Println("gRPC server running on :50051")
	if err := srv.Serve(lis); err != nil {
		log.Fatalf("gRPC server failed: %v", err)
	}
}
