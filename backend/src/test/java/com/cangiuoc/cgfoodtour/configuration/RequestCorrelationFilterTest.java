package com.cangiuoc.cgfoodtour.configuration;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class RequestCorrelationFilterTest {
    private final RequestCorrelationFilter filter = new RequestCorrelationFilter();

    @Test
    void preservesSafeClientRequestIdAndClearsMdc() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestCorrelationFilter.HEADER_NAME, "gateway-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals("gateway-123", response.getHeader(RequestCorrelationFilter.HEADER_NAME));
        assertNull(MDC.get(RequestCorrelationFilter.MDC_KEY));
        verify(chain).doFilter(request, response);
    }

    @Test
    void replacesUnsafeRequestId() {
        String requestId = RequestCorrelationFilter.resolveRequestId("bad\r\nheader");

        assertDoesNotThrow(() -> UUID.fromString(requestId));
    }

    private static final class UUID {
        private static java.util.UUID fromString(String value) {
            return java.util.UUID.fromString(value);
        }
    }
}
