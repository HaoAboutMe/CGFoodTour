package com.cangiuoc.cgfoodtour.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.IDN;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
@Service
public class GoogleMapsUrlResolver {
    private static final Set<String> ALLOWED_HOSTS = Set.of(
            "maps.app.goo.gl",
            "goo.gl",
            "google.com",
            "www.google.com",
            "maps.google.com"
    );
    private static final Set<Integer> REDIRECT_STATUSES = Set.of(301, 302, 303, 307, 308);
    private static final Pattern COORDINATE_HINT = Pattern.compile(
            "(?:!3d-?\\d+(?:\\.\\d+)?!4d-?\\d+(?:\\.\\d+)?|"
                    + "@-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?|"
                    + "[?&](?:q|ll|query|destination|near|center|point)=-?\\d+(?:\\.\\d+)?,-?\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE);
    private static final int MAX_REDIRECTS = 5;
    private static final int MAX_RESPONSE_BYTES = 256 * 1024;

    private final HttpClient httpClient;

    public GoogleMapsUrlResolver() {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build());
    }

    GoogleMapsUrlResolver(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    /**
     * Resolves only explicitly allowlisted Google Maps hosts. Every redirect target is
     * validated again before it can be requested or returned to the coordinate parser.
     */
    public List<String> resolve(String rawUrl) {
        URI current;
        try {
            current = URI.create(rawUrl);
        } catch (IllegalArgumentException exception) {
            return List.of();
        }

        List<String> candidates = new ArrayList<>();
        for (int redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
            if (!isAllowedTarget(current)) {
                return candidates;
            }

            candidates.add(current.toASCIIString());
            if (COORDINATE_HINT.matcher(current.toASCIIString()).find()) {
                return candidates;
            }

            FetchResult response;
            try {
                response = fetch(current);
            } catch (IOException exception) {
                log.warn("Google Maps URL resolution failed for allowed host {}", current.getHost());
                return candidates;
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                return candidates;
            }

            if (REDIRECT_STATUSES.contains(response.statusCode())) {
                if (response.location() == null || response.location().isBlank()
                        || response.location().length() > 2048) {
                    return candidates;
                }
                try {
                    URI redirectTarget = current.resolve(response.location());
                    // Validate before exposing the redirect URL to the parser and before fetching it.
                    if (!isAllowedTarget(redirectTarget)) {
                        return candidates;
                    }
                    current = redirectTarget;
                    continue;
                } catch (IllegalArgumentException exception) {
                    return candidates;
                }
            }

            if (response.statusCode() >= 200 && response.statusCode() < 300
                    && response.body() != null && !response.body().isBlank()) {
                candidates.add(response.body());
            }
            return candidates;
        }
        return candidates;
    }

    boolean isAllowedTarget(URI uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())
                || uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)) {
            return false;
        }

        String host = canonicalHost(uri.getHost());
        return host != null && ALLOWED_HOSTS.contains(host) && hasOnlyPublicAddresses(host);
    }

    boolean hasOnlyPublicAddresses(String host) {
        try {
            InetAddress[] addresses = InetAddress.getAllByName(host);
            if (addresses.length == 0) {
                return false;
            }
            for (InetAddress address : addresses) {
                if (!isPublicAddress(address)) {
                    return false;
                }
            }
            return true;
        } catch (IOException exception) {
            return false;
        }
    }

    static boolean isPublicAddress(InetAddress address) {
        if (address == null || address.isAnyLocalAddress() || address.isLoopbackAddress()
                || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                || address.isMulticastAddress()) {
            return false;
        }

        byte[] bytes = address.getAddress();
        if (address instanceof Inet4Address && bytes.length == 4) {
            int first = Byte.toUnsignedInt(bytes[0]);
            int second = Byte.toUnsignedInt(bytes[1]);
            int third = Byte.toUnsignedInt(bytes[2]);
            return first != 0
                    && first != 10
                    && !(first == 100 && second >= 64 && second <= 127)
                    && first != 127
                    && !(first == 169 && second == 254)
                    && !(first == 172 && second >= 16 && second <= 31)
                    && !(first == 192 && second == 0 && third == 0)
                    && !(first == 192 && second == 0 && third == 2)
                    && !(first == 192 && second == 168)
                    && !(first == 198 && (second == 18 || second == 19))
                    && !(first == 198 && second == 51 && third == 100)
                    && !(first == 203 && second == 0 && third == 113)
                    && first < 224;
        }

        if (address instanceof Inet6Address && bytes.length == 16) {
            int first = Byte.toUnsignedInt(bytes[0]);
            int second = Byte.toUnsignedInt(bytes[1]);
            return (first & 0xfe) != 0xfc
                    && !(first == 0x20 && second == 0x01
                    && Byte.toUnsignedInt(bytes[2]) == 0x0d && Byte.toUnsignedInt(bytes[3]) == 0xb8);
        }
        return false;
    }

    FetchResult fetch(URI uri) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(6))
                .header("User-Agent", "CGFoodTour/1.0 GoogleMapsLinkResolver")
                .header("Accept", "text/html,application/xhtml+xml")
                .GET()
                .build();

        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        String location = response.headers().firstValue("Location").orElse(null);
        String body = "";
        try (InputStream input = response.body()) {
            long declaredLength = response.headers().firstValueAsLong("Content-Length").orElse(-1);
            if (response.statusCode() >= 200 && response.statusCode() < 300
                    && declaredLength <= MAX_RESPONSE_BYTES) {
                byte[] bytes = input.readNBytes(MAX_RESPONSE_BYTES + 1);
                if (bytes.length <= MAX_RESPONSE_BYTES) {
                    body = new String(bytes, StandardCharsets.UTF_8);
                }
            }
        }
        return new FetchResult(response.statusCode(), location, body);
    }

    private String canonicalHost(String host) {
        if (host == null || host.isBlank()) {
            return null;
        }
        try {
            String canonical = IDN.toASCII(host, IDN.USE_STD3_ASCII_RULES).toLowerCase(Locale.ROOT);
            return canonical.endsWith(".") ? canonical.substring(0, canonical.length() - 1) : canonical;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    record FetchResult(int statusCode, String location, String body) {}
}
