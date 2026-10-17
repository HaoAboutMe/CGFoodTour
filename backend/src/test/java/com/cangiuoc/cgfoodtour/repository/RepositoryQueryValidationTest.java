package com.cangiuoc.cgfoodtour.repository;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class RepositoryQueryValidationTest {
    @Test
    void repositoryQueriesAreValid() {
        // The sliced context validates every declared Spring Data repository query.
    }
}
