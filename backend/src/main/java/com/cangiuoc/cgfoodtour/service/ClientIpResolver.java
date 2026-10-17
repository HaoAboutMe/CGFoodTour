package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.configuration.ClientIpProperties;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClientIpResolver {
    private final ClientIpProperties properties;

    public String resolve(HttpServletRequest request) {
        String remote = canonicalIp(request.getRemoteAddr());
        if (!properties.isTrustForwardedHeaders() || !isTrustedProxy(remote)) {
            return remote;
        }

        List<String> hops = forwardedHops(request);
        if (hops.isEmpty() || hops.size() > properties.getMaximumForwardedHops()) {
            return remote;
        }
        for (int index = hops.size() - 1; index >= 0; index--) {
            String hop = canonicalIp(hops.get(index));
            if ("unknown".equals(hop)) return remote;
            if (!isTrustedProxy(hop)) return hop;
        }
        return remote;
    }

    private List<String> forwardedHops(HttpServletRequest request) {
        String forwarded = request.getHeader("Forwarded");
        if (forwarded != null && !forwarded.isBlank()) {
            List<String> values = new ArrayList<>();
            for (String element : forwarded.split(",")) {
                for (String parameter : element.split(";")) {
                    String trimmed = parameter.trim();
                    if (trimmed.regionMatches(true, 0, "for=", 0, 4)) {
                        values.add(stripAddressDecoration(trimmed.substring(4).trim()));
                        break;
                    }
                }
            }
            return values;
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor == null || xForwardedFor.isBlank()) return List.of();
        List<String> values = new ArrayList<>();
        for (String value : xForwardedFor.split(",")) values.add(value.trim());
        return values;
    }

    private String stripAddressDecoration(String value) {
        String result = value;
        if (result.startsWith("\"") && result.endsWith("\"") && result.length() > 1) {
            result = result.substring(1, result.length() - 1);
        }
        if (result.startsWith("[")) {
            int close = result.indexOf(']');
            return close > 0 ? result.substring(1, close) : "unknown";
        }
        int colon = result.lastIndexOf(':');
        if (colon > 0 && result.indexOf(':') == colon && result.substring(colon + 1).matches("\\d+")) {
            result = result.substring(0, colon);
        }
        return result;
    }

    private boolean isTrustedProxy(String ip) {
        if ("unknown".equals(ip)) return false;
        for (String configured : properties.getTrustedProxies()) {
            if (matchesCidr(ip, configured)) return true;
        }
        return false;
    }

    private boolean matchesCidr(String ip, String configured) {
        try {
            String[] parts = configured.trim().split("/", 2);
            if (!isLiteralIp(parts[0])) return false;
            byte[] address = InetAddress.getByName(ip).getAddress();
            byte[] network = InetAddress.getByName(parts[0]).getAddress();
            if (address.length != network.length) return false;
            int prefix = parts.length == 2 ? Integer.parseInt(parts[1]) : address.length * 8;
            if (prefix < 0 || prefix > address.length * 8) return false;
            for (int bit = 0; bit < prefix; bit++) {
                int mask = 1 << (7 - bit % 8);
                if ((address[bit / 8] & mask) != (network[bit / 8] & mask)) return false;
            }
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    private String canonicalIp(String value) {
        if (value == null || value.isBlank()) return "unknown";
        try {
            String candidate = stripAddressDecoration(value.trim());
            if (!isLiteralIp(candidate)) return "unknown";
            InetAddress address = InetAddress.getByName(candidate);
            return address.getHostAddress();
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    private boolean isLiteralIp(String value) {
        if (value == null || value.isBlank()) return false;
        if (value.contains(":")) return value.matches("[0-9a-fA-F:.]+");
        String[] octets = value.split("\\.", -1);
        if (octets.length != 4) return false;
        for (String octet : octets) {
            if (!octet.matches("\\d{1,3}")) return false;
            try {
                if (Integer.parseInt(octet) > 255) return false;
            } catch (NumberFormatException ignored) {
                return false;
            }
        }
        return true;
    }
}
