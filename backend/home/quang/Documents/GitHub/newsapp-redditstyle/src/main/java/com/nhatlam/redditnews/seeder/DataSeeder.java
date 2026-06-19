package com.nhatlam.redditnews.seeder;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.nhatlam.redditnews.entity.*;
import com.nhatlam.redditnews.entity.Article.ArticleStatus;
import com.nhatlam.redditnews.repository.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ArticleRepository articleRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final PasswordEncoder passwordEncoder;
    private final TopicRepository topicRepository;
    private final PostRepository postRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;

    @Override
    public void run(String... args) {
        User admin = seedAdmin();
        seedCategories();
        seedTags();
        if (admin != null) {
            seedArticles(admin);
            seedTopics();
            seedPosts(admin);
            seedVotes(admin);
            seedComments(admin);
        }
    }

    private User seedAdmin() {
        if (!userRepository.existsByEmail("admin@gmail.com")) {
            User admin = User.builder().name("Nhat Lam").email("admin@gmail.com")
                    .password(passwordEncoder.encode("12345")).role(User.UserRole.ADMIN).build();
            User saved = userRepository.save(admin);
            log.info("Admin created: admin@gmail.com");
            return saved;
        }
        return userRepository.findByEmail("admin@gmail.com").orElse(null);
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0)
            return;
        categoryRepository.saveAll(
                Arrays.asList(cat("Công Nghệ", "cong-nghe", "Tin tức về công nghệ, AI, phần mềm và phần cứng mới nhất"),
                        cat("Thể Thao", "the-thao", "Bóng đá, bóng rổ, tennis và các môn thể thao khác"),
                        cat("Tài Chính", "tai-chinh", "Chứng khoán, tiền tệ, đầu tư và kinh tế vĩ mô"),
                        cat("Du Lịch", "du-lich", "Khám phá danh lam thắng cảnh trong và ngoài nước"),
                        cat("Sức Khỏe", "suc-khoe", "Dinh dưỡng, thể dục và lối sống lành mạnh"),
                        cat("Giải Trí", "giai-tri", "Phim ảnh, âm nhạc, nghệ thuật và văn hóa đại chúng"),
                        cat("Thời Trang", "thoi-trang", "Xu hướng thời trang, phong cách sống"),
                        cat("Ẩm Thực", "am-thuc", "Món ngon, công thức nấu ăn và văn hóa ẩm thực")));
        log.info("8 categories seeded");
    }

    private void seedTags() {
        if (tagRepository.count() > 0)
            return;
        tagRepository.saveAll(Arrays.asList(tag("AI", "ai"), tag("Apple", "apple"), tag("Việt Nam", "viet-nam"),
                tag("Sức Khỏe", "suc-khoe"), tag("Bóng Đá", "bong-da"), tag("Khởi Nghiệp", "khoi-nghiep"),
                tag("Chứng Khoán", "chung-khoan"), tag("Du Lịch", "du-lich"), tag("Phim", "phim"),
                tag("Ẩm Thực", "am-thuc"), tag("Crypto", "crypto"), tag("React", "react")));
        log.info("12 tags seeded");
    }

    private void seedArticles(User admin) {
        if (articleRepository.count() > 0)
            return;

        Category congNghe = categoryRepository.findBySlug("cong-nghe").orElseThrow();
        Category taiChinh = categoryRepository.findBySlug("tai-chinh").orElseThrow();
        Category duLich = categoryRepository.findBySlug("du-lich").orElseThrow();
        Category sucKhoe = categoryRepository.findBySlug("suc-khoe").orElseThrow();
        Category giaiTri = categoryRepository.findBySlug("giai-tri").orElseThrow();
        Category theThao = categoryRepository.findBySlug("the-thao").orElseThrow();

        Tag aiTag = tagRepository.findBySlug("ai").orElseThrow();
        Tag appleTag = tagRepository.findBySlug("apple").orElseThrow();
        Tag vnTag = tagRepository.findBySlug("viet-nam").orElseThrow();
        Tag skTag = tagRepository.findBySlug("suc-khoe").orElseThrow();
        Tag bdTag = tagRepository.findBySlug("bong-da").orElseThrow();
        Tag ckTag = tagRepository.findBySlug("chung-khoan").orElseThrow();
        Tag dlTag = tagRepository.findBySlug("du-lich").orElseThrow();
        Tag phimTag = tagRepository.findBySlug("phim").orElseThrow();
        Tag cryptoTag = tagRepository.findBySlug("crypto").orElseThrow();

        List<Article> articles = Arrays.asList(Article.builder()
                .title("Apple chính thức ra mắt chip M4 Ultra: Bước nhảy vọt hiệu năng AI")
                .subtitle("Con chip mạnh mẽ nhất trong lịch sử Apple Silicon mang tới 40 nhân Neural Engine")
                .content(body(
                        "Apple đã chính thức ra mắt chip M4 Ultra tại sự kiện WWDC năm nay, đánh dấu bước tiến lớn trong cuộc đua xử lý AI trên thiết bị cá nhân. Với 40 nhân Neural Engine và tốc độ xử lý lên đến 800 TOPS, M4 Ultra vượt xa các đối thủ cạnh tranh trong phân khúc cao cấp."))
                .imageUrl(
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop")
                .readTime(5).slug("apple-chip-m4-ultra-ai").publishedAt(LocalDateTime.now().minusHours(2)).views(4800L)
                .viewsToday(280).viewsWeek(1200).viewsMonth(4800).isFeatured(true).isEditorsPick(true)
                .status(ArticleStatus.PUBLISHED).user(admin).categories(Arrays.asList(congNghe))
                .tags(Arrays.asList(appleTag, aiTag)).build(),
                Article.builder().title("Khám phá vẻ đẹp bí ẩn của Sơn Đoòng – Hang động lớn nhất thế giới")
                        .subtitle("Hành trình 4 ngày 3 đêm chinh phục kỳ quan thiên nhiên Việt Nam")
                        .content(body(
                                "Nằm ẩn mình sâu trong Vườn quốc gia Phong Nha - Kẻ Bàng, Sơn Đoòng không chỉ là một hang động, nó là cả một hệ sinh thái tách biệt với những đám mây hình thành ngay bên trong lòng núi."))
                        .imageUrl(
                                "https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=1200&auto=format&fit=crop")
                        .readTime(7).slug("kham-pha-son-doong-hang-dong-lon-nhat-the-gioi")
                        .publishedAt(LocalDateTime.now().minusHours(5)).views(6200L).viewsToday(410).viewsWeek(2100)
                        .viewsMonth(6200).isFeatured(true).isEditorsPick(true).status(ArticleStatus.PUBLISHED)
                        .user(admin).categories(Arrays.asList(duLich)).tags(Arrays.asList(vnTag, dlTag)).build(),
                Article.builder().title("VN-Index phá vỡ ngưỡng 1.300 điểm: Cơ hội nào cho nhà đầu tư cá nhân?")
                        .subtitle("Góc nhìn chuyên gia về chu kỳ tăng trưởng và các cổ phiếu tiềm năng Q2/2024")
                        .content(body(
                                "Sau những đợt dao động mạnh kéo dài, VN-Index đã chính thức vượt ngưỡng tâm lý 1.300 điểm trong phiên giao dịch hôm nay với thanh khoản đạt 22.000 tỉ đồng."))
                        .imageUrl(
                                "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop")
                        .readTime(6).slug("vn-index-vuot-1300-diem-co-hoi-nha-dau-tu")
                        .publishedAt(LocalDateTime.now().minusDays(1)).views(9100L).viewsToday(520).viewsWeek(3800)
                        .viewsMonth(9100).isFeatured(true).isEditorsPick(false).status(ArticleStatus.PUBLISHED)
                        .user(admin).categories(Arrays.asList(taiChinh)).tags(Arrays.asList(ckTag, vnTag, cryptoTag))
                        .build(),
                Article.builder().title("Thực đơn Eat Clean 7 ngày cho người mới bắt đầu – Ăn ngon, dáng thon")
                        .subtitle("Bí quyết kiểm soát cân nặng không cần nhịn đói với thực đơn khoa học")
                        .content(body(
                                "Eat Clean đang trở thành xu hướng sống khỏe được ưa chuộng nhất trong giới trẻ Việt Nam. Nguyên tắc cơ bản rất đơn giản: ưu tiên thực phẩm nguyên chất, hạn chế đường tinh luyện, muối, dầu mỡ bão hòa."))
                        .imageUrl(
                                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop")
                        .readTime(8).slug("thuc-don-eat-clean-7-ngay-cho-nguoi-moi-bat-dau")
                        .publishedAt(LocalDateTime.now().minusHours(10)).views(3400L).viewsToday(190).viewsWeek(900)
                        .viewsMonth(3400).isFeatured(false).isEditorsPick(true).status(ArticleStatus.PUBLISHED)
                        .user(admin).categories(Arrays.asList(sucKhoe)).tags(Arrays.asList(skTag, vnTag)).build(),
                Article.builder().title("Review phim: Kẻ Kiến Tạo (The Creator) – Bản giao hương giữa người và AI")
                        .subtitle("Nghệ thuật đồ họa đỉnh cao trong tác phẩm Sci-Fi của Gareth Edwards")
                        .content(body(
                                "Dưới góc máy của đạo diễn Gareth Edwards, The Creator mang lại một hệ thống thị giác Sci-fi vừa tàn khốc vừa nên thơ. Bộ phim đặt ra những câu hỏi triết học sâu sắc về ý thức, cảm xúc và ranh giới giữa con người với trí tuệ nhân tạo."))
                        .imageUrl(
                                "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1200&auto=format&fit=crop")
                        .readTime(4).slug("review-phim-ke-kien-tao-the-creator-2024")
                        .publishedAt(LocalDateTime.now().minusDays(2)).views(2700L).viewsToday(130).viewsWeek(650)
                        .viewsMonth(2700).isFeatured(false).isEditorsPick(true).status(ArticleStatus.PUBLISHED)
                        .user(admin).categories(Arrays.asList(giaiTri)).tags(Arrays.asList(phimTag, aiTag)).build(),
                Article.builder().title("EURO 2024: Tây Ban Nha vô địch sau chiến thắng nghẹt thở trước Anh")
                        .subtitle("La Roja xứng đáng với danh hiệu sau 120 phút đầy kịch tính tại Berlin")
                        .content(body(
                                "Sân vận động Olympiastadion Berlin rực đỏ trong đêm chung kết EURO 2024 khi Tây Ban Nha giành chức vô địch lần thứ 4 trong lịch sử. Lứa cầu thủ trẻ tài năng dẫn dắt bởi Yamal 17 tuổi đã chứng minh thế hệ vàng mới của bóng đá Tây Ban Nha đã thực sự trưởng thành."))
                        .imageUrl(
                                "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1200&auto=format&fit=crop")
                        .readTime(5).slug("euro-2024-tay-ban-nha-vo-dich-danh-bai-anh")
                        .publishedAt(LocalDateTime.now().minusDays(3)).views(12000L).viewsToday(680).viewsWeek(4500)
                        .viewsMonth(12000).isFeatured(true).isEditorsPick(false).status(ArticleStatus.PUBLISHED)
                        .user(admin).categories(Arrays.asList(theThao)).tags(Arrays.asList(bdTag, vnTag)).build(),
                Article.builder().title("Toàn cảnh hệ sinh thái AI Việt Nam 2024: Từ startup đến doanh nghiệp lớn")
                        .subtitle("Báo cáo toàn diện về xu hướng ứng dụng AI trong doanh nghiệp Việt")
                        .content(body(
                                "Năm 2024 đánh dấu bước ngoặt quan trọng của trí tuệ nhân tạo tại Việt Nam khi hàng trăm doanh nghiệp từ startup nhỏ đến tập đoàn lớn như Viettel, VinAI, FPT đều công bố chiến lược AI rõ ràng."))
                        .imageUrl(
                                "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1200&auto=format&fit=crop")
                        .readTime(10).slug("he-sinh-thai-ai-viet-nam-2024")
                        .publishedAt(LocalDateTime.now().minusDays(1)).views(5500L).viewsToday(350).viewsWeek(1800)
                        .viewsMonth(5500).isFeatured(false).isEditorsPick(true).status(ArticleStatus.PUBLISHED)
                        .user(admin).categories(Arrays.asList(congNghe, taiChinh)).tags(Arrays.asList(aiTag, vnTag))
                        .build(),
                Article.builder().title("Bitcoin vượt 100.000 USD: Kỷ nguyên mới của tiền mã hóa hay bong bóng?")
                        .subtitle("Phân tích kỹ thuật và góc nhìn chuyên gia về đợt tăng giá lịch sử này")
                        .content(body(
                                "Ngưỡng 100.000 USD mà cộng đồng crypto mơ đến suốt nhiều năm qua cuối cùng đã bị phá vỡ. Với việc ETF Bitcoin Spot được SEC phê duyệt và sự tham gia ngày càng nhiều của các quỹ đầu tư tổ chức, Bitcoin đang dần trở thành một loại tài sản lưu trữ giá trị hợp pháp."))
                        .imageUrl(
                                "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1200&auto=format&fit=crop")
                        .readTime(7).slug("bitcoin-vuot-100000-usd-ky-nguyen-moi-hay-bong-bong")
                        .publishedAt(LocalDateTime.now().minusHours(18)).views(8300L).viewsToday(490).viewsWeek(2900)
                        .viewsMonth(8300).isFeatured(true).isEditorsPick(false).status(ArticleStatus.PUBLISHED)
                        .user(admin).categories(Arrays.asList(taiChinh)).tags(Arrays.asList(cryptoTag, ckTag)).build());

        articleRepository.saveAll(articles);
        log.info("{} articles seeded", articles.size());
    }

    private void seedTopics() {
        if (topicRepository.count() > 0)
            return;
        topicRepository.saveAll(Arrays.asList(
                new Topic(null, "Công Nghệ", "cong-nghe", "Thảo luận về AI, Lập trình và Thiết bị số", LocalDateTime.now()),
                new Topic(null, "Thể Thao", "the-thao", "Tin tức bóng đá, tennis và các giải đấu lớn", LocalDateTime.now()),
                new Topic(null, "Giải Trí", "giai-tri", "Phim ảnh, âm nhạc và show truyền hình", LocalDateTime.now())));
        log.info("3 topics seeded");
    }

    private void seedPosts(User admin) {
        if (postRepository.count() > 0)
            return;

        Topic congNghe = topicRepository.findBySlug("cong-nghe").orElseThrow();
        Topic theThao = topicRepository.findBySlug("the-thao").orElseThrow();
        Article m4Article = articleRepository.findBySlugAndStatus("apple-chip-m4-ultra-ai", ArticleStatus.PUBLISHED).orElse(null);

        Post m4Post = new Post();
        m4Post.setTitle("Liệu chip M4 Ultra có thực sự cần thiết cho người dùng phổ thông?");
        m4Post.setContent("Tôi thấy chip M4 quá mạnh so với nhu cầu làm việc văn phòng hay code cơ bản...");
        m4Post.setScore(0);
        m4Post.setUser(admin);
        m4Post.setTopic(congNghe);
        m4Post.setArticle(m4Article);

        Post championsLeaguePost = new Post();
        championsLeaguePost.setTitle("Dự đoán nhà vô địch Champions League năm nay?");
        championsLeaguePost.setContent("Mọi người nghĩ Real Madrid hay Man City sẽ lên ngôi vô địch năm nay?");
        championsLeaguePost.setScore(0);
        championsLeaguePost.setUser(admin);
        championsLeaguePost.setTopic(theThao);

        postRepository.saveAll(Arrays.asList(m4Post, championsLeaguePost));
        log.info("2 posts seeded");
    }

    private void seedVotes(User admin) {
        if (voteRepository.count() > 0)
            return;

        List<Post> posts = postRepository.findAll();
        if (posts.isEmpty())
            return;

        Post post = posts.get(0);
        voteRepository.save(new Vote(null, 1, admin, post, LocalDateTime.now()));
        post.setScore(1);
        postRepository.save(post);
        log.info("1 vote seeded");
    }

    private void seedComments(User admin) {
        if (commentRepository.count() > 0)
            return;

        Article article = articleRepository.findAll().stream().findFirst().orElse(null);
        if (article == null)
            return;

        Comment c1 = Comment.builder()
                .article(article)
                .user(admin)
                .userName(admin.getName())
                .userAvatar(admin.getAvatar())
                .content("Bài viết này phân tích rất chi tiết, cảm ơn tác giả!")
                .likes(5)
                .build();
        c1 = commentRepository.save(c1);

        Comment c1_1 = Comment.builder()
                .article(article)
                .user(admin)
                .userName("User Test 1")
                .content("Đồng ý với bạn nha, nhất là phần so sánh hiệu năng.")
                .parent(c1)
                .likes(2)
                .build();
        c1_1 = commentRepository.save(c1_1);

        Comment c1_1_1 = Comment.builder()
                .article(article)
                .user(admin)
                .userName("User Test 2")
                .content("Nhưng giá chip thế này chắc chắn thiết bị sẽ rất đắt.")
                .parent(c1_1)
                .likes(0)
                .build();
        commentRepository.save(c1_1_1);

        Comment c2 = Comment.builder()
                .article(article)
                .user(admin)
                .userName("User Test 3")
                .content("Bao giờ sản phẩm này mở bán chính thức tại Việt Nam nhỉ?")
                .likes(1)
                .build();
        commentRepository.save(c2);

        log.info("Nested comments tree seeded successfully");
    }

    private Category cat(String name, String slug, String desc) {
        return Category.builder().name(name).slug(slug).description(desc).build();
    }

    private Tag tag(String name, String slug) {
        return Tag.builder().name(name).slug(slug).build();
    }

    private String body(String lead) {
        return lead + "\n\n"
                + "Theo các chuyên gia, xu hướng này phản ánh sự thay đổi căn bản trong cách thị trường vận hành và "
                + "tiếp cận của người dùng đối với các sản phẩm, dịch vụ mới. Các số liệu thống kê gần đây cho thấy "
                + "tốc độ tăng trưởng vượt bậc so với cùng kỳ năm ngoái, mở ra nhiều cơ hội và thách thức mới.\n\n"
                + "Nhìn về tương lai, các nhà phân tích kỳ vọng diễn biến sẽ tiếp tục tích cực trong thời gian tới, "
                + "đặc biệt khi các yếu tố vĩ mô thuận lợi hơn. Tuy nhiên, các rủi ro tiềm ẩn cần được theo dõi "
                + "chặt chẽ để kịp thời điều chỉnh chiến lược.\n\n"
                + "Độc giả quan tâm có thể theo dõi thêm các bài viết liên quan trên TouraneNews để cập nhật "
                + "thông tin mới nhất và phân tích sâu hơn từ đội ngũ chuyên gia của chúng tôi.";
    }
}
