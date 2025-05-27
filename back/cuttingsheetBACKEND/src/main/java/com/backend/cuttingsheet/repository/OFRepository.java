package com.backend.cuttingsheet.repository;

import com.backend.cuttingsheet.entity.OF;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OFRepository extends JpaRepository<OF, Long> {
    Optional<OF> findByOrderNumberAndArticle(String orderNumber, String article);

    @Query("SELECT o FROM OF o WHERE :data IS NULL OR " +
           "LOWER(o.orderNumber) LIKE LOWER(CONCAT('%', :data, '%')) OR " +
           "LOWER(o.article) LIKE LOWER(CONCAT('%', :data, '%')) OR " +
           "LOWER(o.programme) LIKE LOWER(CONCAT('%', :data, '%')) " +
           "ORDER BY o.priority DESC, o.createdAt DESC")
    List<OF> searchOFs(@Param("data") String data);
}