package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.configuration.ClientIpProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpResolverTest {
    @Test
    void ignoresSpoofedHeaderFromUntrustedPeer() {
        ClientIpProperties properties = new ClientIpProperties();
        properties.setTrustForwardedHeaders(true);
        properties.setTrustedProxies(List.of("10.0.0.0/8"));
        ClientIpResolver resolver = new ClientIpResolver(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.7");
        request.addHeader("X-Forwarded-For", "1.2.3.4");

        assertThat(resolver.resolve(request)).isEqualTo("203.0.113.7");
    }

    @Test
    void selectsFirstUntrustedHopFromRightBehindTrustedProxies() {
        ClientIpProperties properties = new ClientIpProperties();
        properties.setTrustForwardedHeaders(true);
        properties.setTrustedProxies(List.of("10.0.0.0/8", "192.168.0.0/16"));
        ClientIpResolver resolver = new ClientIpResolver(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");
        request.addHeader("X-Forwarded-For", "198.51.100.9, 192.168.1.3");

        assertThat(resolver.resolve(request)).isEqualTo("198.51.100.9");
    }

    @Test
    void malformedForwardedHeaderFallsBackToRemotePeer() {
        ClientIpProperties properties = new ClientIpProperties();
        properties.setTrustForwardedHeaders(true);
        properties.setTrustedProxies(List.of("10.0.0.0/8"));
        ClientIpResolver resolver = new ClientIpResolver(properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.2");
        request.addHeader("Forwarded", "for=not-an-ip");

        assertThat(resolver.resolve(request)).isEqualTo("10.0.0.2");
    }
}
