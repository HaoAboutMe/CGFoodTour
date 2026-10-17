package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.configuration.MapsResolverProperties;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.function.Supplier;

@Service
public class GoogleMapsAbuseProtectionService {
    private final AuthAbuseProtectionService abuseProtectionService;
    private final MapsResolverProperties properties;
    private final Semaphore permits;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public GoogleMapsAbuseProtectionService(AuthAbuseProtectionService abuseProtectionService,
                                            MapsResolverProperties properties) {
        this.abuseProtectionService = abuseProtectionService;
        this.properties = properties;
        this.permits = new Semaphore(properties.getMaximumConcurrentRequests(), true);
    }

    public Map<String, String> resolve(String userId, String clientIp, String rawUrl,
                                       Supplier<Map<String, String>> resolver) {
        if (rawUrl == null || rawUrl.isBlank() || rawUrl.length() > 2048
                || rawUrl.chars().anyMatch(Character::isISOControl)) {
            throw new AppException(ErrorCode.INVALID_MAP_URL);
        }
        abuseProtectionService.checkMapsResolutionAttempt(userId, clientIp);
        String cacheKey = digest(rawUrl == null ? "" : rawUrl.trim());
        Instant now = Instant.now();
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && cached.expiresAt().isAfter(now)) return cached.value();
        if (cached != null) cache.remove(cacheKey, cached);

        if (!permits.tryAcquire()) throw new AppException(ErrorCode.MAP_RESOLUTION_BUSY);
        try {
            Map<String, String> result = Map.copyOf(resolver.get());
            ensureCacheCapacity(now);
            var ttl = result.isEmpty() ? properties.getNegativeCacheTtl() : properties.getSuccessCacheTtl();
            cache.put(cacheKey, new CacheEntry(result, now.plus(ttl)));
            return result;
        } finally {
            permits.release();
        }
    }

    private void ensureCacheCapacity(Instant now) {
        if (cache.size() < properties.getMaximumCacheEntries()) return;
        cache.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
        if (cache.size() >= properties.getMaximumCacheEntries()) {
            cache.keySet().stream().findFirst().ifPresent(cache::remove);
        }
    }

    private String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create map cache key", exception);
        }
    }

    private record CacheEntry(Map<String, String> value, Instant expiresAt) {}
}
