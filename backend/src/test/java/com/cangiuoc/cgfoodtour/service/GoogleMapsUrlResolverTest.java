package com.cangiuoc.cgfoodtour.service;

import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.util.ArrayDeque;
import java.util.List;
import java.util.Queue;

import static org.assertj.core.api.Assertions.assertThat;

class GoogleMapsUrlResolverTest {

    @Test
    void followsAllowlistedRedirectAndStopsWhenCoordinatesArePresent() {
        FakeResolver resolver = new FakeResolver(true, new GoogleMapsUrlResolver.FetchResult(
                302,
                "https://www.google.com/maps/place/example/@10.602913,106.656247,64m/"
                        + "data=!3d10.6031282!4d106.6565301",
                ""));

        List<String> candidates = resolver.resolve("https://maps.app.goo.gl/oW3cwtzLXYQXrYLN8");

        assertThat(candidates).hasSize(2);
        assertThat(candidates.get(1)).contains("!3d10.6031282!4d106.6565301");
        assertThat(resolver.fetchCount).isEqualTo(1);
    }

    @Test
    void rejectsNonHttpsUnknownHostsAndUnsafeRedirectTargets() {
        FakeResolver unknownHost = new FakeResolver(true);
        assertThat(unknownHost.resolve("https://attacker.example/maps")).isEmpty();
        assertThat(unknownHost.resolve("http://maps.app.goo.gl/example")).isEmpty();
        assertThat(unknownHost.fetchCount).isZero();

        FakeResolver unsafeRedirect = new FakeResolver(true,
                new GoogleMapsUrlResolver.FetchResult(302, "https://127.0.0.1/admin", ""));
        assertThat(unsafeRedirect.resolve("https://maps.app.goo.gl/example"))
                .containsExactly("https://maps.app.goo.gl/example");
        assertThat(unsafeRedirect.fetchCount).isEqualTo(1);
    }

    @Test
    void rejectsHostsWhenDnsContainsANonPublicAddress() {
        FakeResolver resolver = new FakeResolver(false);

        assertThat(resolver.resolve("https://maps.app.goo.gl/example")).isEmpty();
        assertThat(resolver.fetchCount).isZero();
    }

    @Test
    void classifiesPrivateAndPublicAddresses() throws Exception {
        assertThat(GoogleMapsUrlResolver.isPublicAddress(InetAddress.getByName("127.0.0.1"))).isFalse();
        assertThat(GoogleMapsUrlResolver.isPublicAddress(InetAddress.getByName("169.254.169.254"))).isFalse();
        assertThat(GoogleMapsUrlResolver.isPublicAddress(InetAddress.getByName("10.0.0.1"))).isFalse();
        assertThat(GoogleMapsUrlResolver.isPublicAddress(InetAddress.getByName("100.64.0.1"))).isFalse();
        assertThat(GoogleMapsUrlResolver.isPublicAddress(InetAddress.getByName("8.8.8.8"))).isTrue();
        assertThat(GoogleMapsUrlResolver.isPublicAddress(InetAddress.getByName("::1"))).isFalse();
        assertThat(GoogleMapsUrlResolver.isPublicAddress(InetAddress.getByName("fc00::1"))).isFalse();
    }

    private static class FakeResolver extends GoogleMapsUrlResolver {
        private final boolean publicDns;
        private final Queue<FetchResult> responses;
        private int fetchCount;

        FakeResolver(boolean publicDns, FetchResult... responses) {
            super(HttpClient.newHttpClient());
            this.publicDns = publicDns;
            this.responses = new ArrayDeque<>(List.of(responses));
        }

        @Override
        boolean hasOnlyPublicAddresses(String host) {
            return publicDns;
        }

        @Override
        FetchResult fetch(URI uri) {
            fetchCount++;
            return responses.remove();
        }
    }
}
