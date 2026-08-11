-- ============================================================
-- haibao 海报生成器数据库建表脚本
-- MySQL 8.0+
-- 执行顺序: schema.sql → seed.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS haibao
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE haibao;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- 海报业务数据
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(100)    NOT NULL COMMENT '品牌标识码',
    name        VARCHAR(200)    NOT NULL COMMENT '品牌名称',
    description VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '品牌描述',
    logo_url    VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '品牌Logo URL',
    is_active   TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order  INT             NOT NULL DEFAULT 0,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='品牌';

CREATE TABLE IF NOT EXISTS festivals (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(100)    NOT NULL COMMENT '节日标识码',
    name            VARCHAR(100)    NOT NULL COMMENT '节日名称',
    color_scheme    VARCHAR(200)    NOT NULL DEFAULT '' COMMENT '配色方案描述',
    primary_color   VARCHAR(20)     NOT NULL DEFAULT '#C41E3A' COMMENT '主色 hex',
    secondary_color VARCHAR(20)     NOT NULL DEFAULT '#FFD700' COMMENT '辅色 hex',
    bg_color        VARCHAR(20)     NOT NULL DEFAULT '#8B0000' COMMENT '背景色 hex',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='节日';

CREATE TABLE IF NOT EXISTS discount_types (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(100)    NOT NULL COMMENT '标识码',
    name            VARCHAR(200)    NOT NULL COMMENT '类型名称',
    category        VARCHAR(50)     NOT NULL DEFAULT '' COMMENT '分组',
    short_desc      VARCHAR(200)    NOT NULL DEFAULT '' COMMENT '简短示例',
    format_template VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '格式化模板',
    input_prompts   VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '输入提示语',
    fields          JSON            NOT NULL COMMENT '表单字段定义',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_code (code),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠类型';

CREATE TABLE IF NOT EXISTS merchants (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL COMMENT '店铺名称',
    address     VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '地址',
    phone       VARCHAR(50)     NOT NULL DEFAULT '' COMMENT '电话',
    is_default  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '是否系统预设',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商户模板';

-- ============================================================
-- 用户产出数据
-- ============================================================

CREATE TABLE IF NOT EXISTS poster_projects (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_code    VARCHAR(100)    NOT NULL COMMENT '项目编号',
    title           VARCHAR(300)    NOT NULL DEFAULT '' COMMENT '项目标题',
    material_type   VARCHAR(30)     NOT NULL DEFAULT 'poster' COMMENT '类型: poster|car-sticker',
    festival_code   VARCHAR(100)    DEFAULT NULL COMMENT '关联节日',
    brand_code      VARCHAR(100)    DEFAULT NULL COMMENT '关联品牌',
    start_date      DATE            DEFAULT NULL COMMENT '活动开始日期',
    end_date        DATE            DEFAULT NULL COMMENT '活动结束日期',
    theme           VARCHAR(300)    NOT NULL DEFAULT '' COMMENT '海报主题',
    subtitle        VARCHAR(300)    NOT NULL DEFAULT '' COMMENT '副标题',
    front_poster_url VARCHAR(500)   DEFAULT NULL COMMENT '正面海报图片URL',
    back_poster_url  VARCHAR(500)   DEFAULT NULL COMMENT '背面海报图片URL',
    back_bg_url      VARCHAR(500)   DEFAULT NULL COMMENT '背面背景图URL',
    car_sticker_url  VARCHAR(500)   DEFAULT NULL COMMENT '车贴图片URL',
    back_leafer_json JSON           DEFAULT NULL COMMENT '背面完整 Leafer JSON',
    back_layout      JSON           DEFAULT NULL COMMENT '背面布局数据',
    raw_data         JSON           NOT NULL COMMENT '完整原始表单数据',
    status          VARCHAR(20)     NOT NULL DEFAULT 'draft' COMMENT '状态: draft|completed|archived',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_project_code (project_code),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='海报项目';

CREATE TABLE IF NOT EXISTS project_activities (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id      BIGINT UNSIGNED NOT NULL COMMENT '海报项目ID',
    discount_type_code VARCHAR(100) NOT NULL COMMENT '优惠类型标识',
    activity_type   VARCHAR(50)     NOT NULL DEFAULT '',
    discount_detail VARCHAR(500)    NOT NULL DEFAULT '',
    content         TEXT            COMMENT '活动内容文本',
    highlight       VARCHAR(500)    DEFAULT NULL,
    field_values    JSON            DEFAULT NULL,
    image_urls      JSON            DEFAULT NULL,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_project (project_id),
    FOREIGN KEY (project_id) REFERENCES poster_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目关联活动';

CREATE TABLE IF NOT EXISTS uploaded_files (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    file_name       VARCHAR(300)    NOT NULL COMMENT '原始文件名',
    file_path       VARCHAR(500)    NOT NULL COMMENT '存储路径',
    file_url        VARCHAR(500)    NOT NULL COMMENT '访问URL',
    file_size       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '文件大小(字节)',
    mime_type       VARCHAR(100)    NOT NULL DEFAULT '',
    width           INT UNSIGNED    DEFAULT NULL,
    height          INT UNSIGNED    DEFAULT NULL,
    usage_type      VARCHAR(30)     NOT NULL DEFAULT 'general' COMMENT '用途',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_usage (usage_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='上传文件';

-- ============================================================
-- 提示词系统
-- ============================================================

CREATE TABLE IF NOT EXISTS prompt_templates (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(100)    NOT NULL COMMENT '模板标识码',
    name            VARCHAR(200)    NOT NULL COMMENT '模板名称',
    scene           VARCHAR(50)     NOT NULL COMMENT '使用场景',
    description     VARCHAR(500)    NOT NULL DEFAULT '' COMMENT '用途说明',
    template_text   TEXT            NOT NULL COMMENT '提示词模板',
    variables       JSON            DEFAULT NULL COMMENT '变量定义',
    negative_prompt TEXT            DEFAULT NULL COMMENT '负面提示词',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_code (code),
    INDEX idx_scene (scene)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词模板';

CREATE TABLE IF NOT EXISTS festival_designs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    festival_code   VARCHAR(100)    NOT NULL COMMENT '节日标识',
    color_desc      TEXT            NOT NULL COMMENT '配色描述',
    decoration_desc TEXT            NOT NULL COMMENT '装饰元素描述',
    prohibition     TEXT            COMMENT '禁止事项',
    prompt_template_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联提示词模板',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_festival (festival_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='节日背景设计配置';

CREATE TABLE IF NOT EXISTS visual_styles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL COMMENT '风格标识',
    name            VARCHAR(100)    NOT NULL COMMENT '风格名称',
    description     TEXT            NOT NULL COMMENT '详细风格描述',
    short_desc      TEXT            NOT NULL COMMENT '简短描述',
    bg_desc         TEXT            NOT NULL COMMENT '纯背景描述',
    negative_prompt TEXT            DEFAULT NULL COMMENT '负面提示词',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视觉风格配置';

CREATE TABLE IF NOT EXISTS art_styles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL COMMENT '风格标识',
    name            VARCHAR(100)    NOT NULL COMMENT '风格名称',
    prompt_text     TEXT            NOT NULL COMMENT '风格迁移提示词',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='艺术风格';
