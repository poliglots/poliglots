package store

import (
	"encoding/json"
	"fmt"
	"os"
	"sync"
	"time"
)

// Option configures the store.
type Option func(*options)

type options struct {
	maxSize    int
	eviction   EvictionPolicy
	defaultTTL time.Duration
}

// EvictionPolicy defines key eviction strategy.
type EvictionPolicy int

const (
	EvictNone EvictionPolicy = iota
	EvictLRU
)

// Store is a concurrent-safe in-memory key-value store.
type Store struct {
	mu       sync.RWMutex
	data     map[string]*entry
	options  options
}

type entry struct {
	value     []byte
	createdAt time.Time
	expiresAt time.Time
	lastAccess time.Time
}

// New creates a new key-value store.
func New(opts ...Option) *Store {
	s := &Store{
		data: make(map[string]*entry),
		options: options{
			maxSize:  1000000,
			eviction: EvictNone,
		},
	}

	for _, opt := range opts {
		opt(&s.options)
	}

	return s
}

// WithMaxSize sets the maximum number of keys.
func WithMaxSize(n int) Option {
	return func(o *options) { o.maxSize = n }
}

// WithEviction sets the eviction policy.
func WithEviction(policy EvictionPolicy) Option {
	return func(o *options) { o.eviction = policy }
}

// WithDefaultTTL sets the default TTL for new entries.
func WithDefaultTTL(ttl time.Duration) Option {
	return func(o *options) { o.defaultTTL = ttl }
}

// Set adds or updates a key-value pair.
func (s *Store) Set(key string, value []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.data) >= s.options.maxSize && s.options.eviction == EvictLRU {
		s.evictLRU()
	}

	expiresAt := time.Time{}
	if s.options.defaultTTL > 0 {
		expiresAt = time.Now().Add(s.options.defaultTTL)
	}

	s.data[key] = &entry{
		value:      value,
		createdAt:  time.Now(),
		expiresAt:  expiresAt,
		lastAccess: time.Now(),
	}

	return nil
}

// Get retrieves a value by key.
func (s *Store) Get(key string) ([]byte, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entry, ok := s.data[key]
	if !ok {
		return nil, fmt.Errorf("key not found: %s", key)
	}

	// Check expiration
	if !entry.expiresAt.IsZero() && time.Now().After(entry.expiresAt) {
		s.mu.RUnlock()
		s.mu.Lock()
		delete(s.data, key)
		s.mu.Unlock()
		s.mu.RLock()
		return nil, fmt.Errorf("key expired: %s", key)
	}

	entry.lastAccess = time.Now()
	return entry.value, nil
}

// Delete removes a key.
func (s *Store) Delete(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.data, key)
	return nil
}

// Exists checks if a key exists.
func (s *Store) Exists(key string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, ok := s.data[key]
	return ok
}

// Count returns the number of keys.
func (s *Store) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.data)
}

// Snapshot persists the store to disk.
func (s *Store) Snapshot(path string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	type snapshot struct {
		Entries map[string]snapshotEntry `json:"entries"`
	}

	type snapshotEntry struct {
		Value     []byte `json:"v"`
		CreatedAt int64  `json:"c"`
		ExpiresAt int64  `json:"e"`
	}

	snap := snapshot{
		Entries: make(map[string]snapshotEntry),
	}

	for k, e := range s.data {
		snap.Entries[k] = snapshotEntry{
			Value:     e.value,
			CreatedAt: e.createdAt.UnixNano(),
			ExpiresAt: e.expiresAt.UnixNano(),
		}
	}

	data, _ := json.Marshal(snap)
	return os.WriteFile(path, data, 0644)
}

// LoadSnapshot restores the store from disk.
func (s *Store) LoadSnapshot(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var snap snapshot
	if err := json.Unmarshal(data, &snap); err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for k, e := range snap.Entries {
		s.data[k] = &entry{
			value:     e.Value,
			createdAt: time.UnixNano(e.CreatedAt),
			expiresAt: time.UnixNano(e.ExpiresAt),
		}
	}

	return nil
}

// Close releases resources.
func (s *Store) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data = nil
	return nil
}

// evictLRU removes the least recently used entry.
func (s *Store) evictLRU() {
	var oldestKey string
	var oldestTime time.Time

	for k, e := range s.data {
		if oldestTime.IsZero() || e.lastAccess.Before(oldestTime) {
			oldestKey = k
			oldestTime = e.lastAccess
		}
	}

	if oldestKey != "" {
		delete(s.data, oldestKey)
	}
}
