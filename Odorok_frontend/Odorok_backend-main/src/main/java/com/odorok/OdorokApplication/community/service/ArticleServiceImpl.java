package com.odorok.OdorokApplication.community.service;

import com.odorok.OdorokApplication.community.dto.request.ArticleRegistRequest;
import com.odorok.OdorokApplication.community.dto.request.ArticleSearchCondition;
import com.odorok.OdorokApplication.community.dto.response.ArticleSummary;
import com.odorok.OdorokApplication.community.repository.ArticleRepository;
import com.odorok.OdorokApplication.draftDomain.Article;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleServiceImpl implements ArticleService{
    private final ArticleImageService articleImageService;
    private final ArticleRepository articleRepository;
    private final ArticleTransactionService articleTransactionService;

    @Override
    public void insertArticle(ArticleRegistRequest request, List<MultipartFile> images, Long userId) {
        List<String> urls = articleImageService.insertArticleImages(userId,images);
        Article article = Article.builder().title(request.getTitle()).content(request.getContent())
                .boardType(request.getBoardType()).notice(request.getNotice())
                .diseaseId(request.getDiseaseId()).courseId(request.getCourseId()).userId(userId).build();
        try {
            articleTransactionService.insertArticleTransactional(article, urls, userId);  // 트랜잭션 메서드
        } catch (Exception e) {
            articleImageService.deleteImages(urls); // 수동 롤백
            throw e;
        }
    }

    @Override
    public List<ArticleSummary> findByCondition(ArticleSearchCondition condition) {
        return articleRepository.findByCondition(condition);
    }

    @Override
    public Article findByArticleId(Long articleId) {
        Article article = articleRepository.getById(articleId);
        return article;
    }

    @Override
    public void deleteArticle(Long articleId) {
        articleRepository.deleteById(articleId);
    }


}
