-- ============================================================
-- haibao 业务数据导入
-- 包含: 品牌、节日、优惠类型、商户、节日设计、视觉风格、艺术风格
-- ============================================================

USE haibao;
SET NAMES utf8mb4;

-- ============================================================
-- 品牌 (8 条)
-- ============================================================

INSERT INTO brands (code, name, description, sort_order) VALUES
('chow-tai-fook', '周大福', '中国最大珠宝品牌', 1),
('chow-sang-sang', '周生生', '经典珠宝品牌', 2),
('lao-feng-xiang', '老凤祥', '百年民族品牌', 3),
('chow-tai-seng', '周大生', '知名珠宝品牌', 4),
('luk-fook', '六福珠宝', '国际珠宝品牌', 5),
('tsl', '谢瑞麟', '轻奢珠宝品牌', 6),
('ming-pai', '明牌珠宝', '时尚珠宝品牌', 7),
('chic-legend', '潮宏基', '时尚设计珠宝品牌', 8);

-- ============================================================
-- 节日 (33 条)
-- ============================================================

INSERT INTO festivals (code, name, color_scheme, primary_color, secondary_color, bg_color, sort_order) VALUES
('spring-festival', '春节', '中国红与金色', '#C41E3A', '#FFD700', '#8B0000', 1),
('yuanxiao', '元宵节', '红色与暖黄', '#DC143C', '#FFD700', '#3B0A0A', 2),
('qingming', '清明节', '青绿与素白', '#2E8B57', '#F0F0F0', '#1A2A1A', 3),
('dragon-boat', '端午节', '翠绿与粽叶绿', '#2E8B57', '#8B4513', '#1A3C2A', 4),
('qixi', '七夕节', '紫色与粉色渐变', '#9B59B6', '#FF69B4', '#2C0E37', 5),
('mid-autumn', '中秋节', '金色与深蓝色', '#FFD700', '#1A237E', '#0D1B2A', 6),
('chongyang', '重阳节', '暖金色与茱萸红', '#D2691E', '#8B0000', '#2A1A0A', 7),
('winter-solstice', '冬至', '暖红与雪白', '#CD5C5C', '#F5FFFA', '#1A1A2E', 8),
('laban', '腊八节', '温暖的陶土红', '#B22222', '#DEB887', '#2A1A0A', 9),
('new-year', '元旦', '金色与红色', '#FF4500', '#FFD700', '#2B0F0F', 10),
('valentine', '情人节', '粉色与玫瑰红', '#FF69B4', '#FF1493', '#FFF0F5', 11),
('white-valentine', '白色情人节', '纯白与淡粉', '#FFB6C1', '#F0F0F0', '#2A1A2A', 12),
('520-day', '520表白日', '浪漫粉与炽热红', '#FF1493', '#FF4500', '#2A0A1A', 13),
('mother-day', '母亲节', '暖粉与香槟金', '#FFB6C1', '#F5E6CC', '#4A1A2C', 14),
('father-day', '父亲节', '深蓝与银灰', '#1C3D5A', '#C0C0C0', '#0A1628', 15),
('teachers-day', '教师节', '温暖米色与金色', '#DAA520', '#F5DEB3', '#1A1A0A', 16),
('national-day', '国庆节', '中国红与金色', '#E60012', '#FFD700', '#8B0000', 17),
('christmas', '圣诞节', '圣诞红与松绿', '#CC0000', '#2E8B57', '#0A2F0A', 18),
('halloween', '万圣节', '暗紫与鬼魅橙', '#FF8C00', '#6A0DAD', '#0A0A1A', 19),
('thanksgiving', '感恩节', '暖橙与丰收金', '#D2691E', '#FFD700', '#2A1A0A', 20),
('women-day', '三八女神节', '优雅粉与玫瑰金', '#FF69B4', '#E8B4B8', '#3A1A2A', 21),
('girl-day', '女生节', '樱花粉与薰衣草紫', '#FFB7C5', '#B19CD9', '#2A1A3A', 22),
('double-eleven', '双11', '黑色与橙色', '#FF4500', '#000000', '#1A1A2E', 23),
('double-twelve', '双12', '蓝色与橙色', '#4169E1', '#FF6347', '#0D1B2A', 24),
('618-sale', '618年中促', '活力红与科技蓝', '#E60012', '#4169E1', '#1A0A0A', 25),
('black-friday', '黑五狂欢', '黑金撞色', '#FFD700', '#1A1A1A', '#000000', 26),
('anniversary', '周年庆', '华丽金与庆典红', '#FFD700', '#DC143C', '#1A0A0A', 27),
('grand-opening', '开业庆典', '喜庆红与金色', '#FF0000', '#FFD700', '#2B0F0F', 28),
('new-arrival-spring', '春季上新', '春意绿与樱花粉', '#4CAF50', '#FFB7C5', '#0A1A0A', 29),
('new-arrival-autumn', '秋季上新', '秋日金与枫叶红', '#FF6347', '#DAA520', '#1A0A0A', 30),
('season-clearance', '换季清仓', '明黄与亮橙', '#FFD700', '#FF8C00', '#1A1A0A', 31),
('member-day', '会员日', '尊贵紫与金色', '#800080', '#FFD700', '#1A0A2A', 32),
('wedding-season', '婚嫁季', '浪漫粉与纯白', '#FFB6C1', '#F5FFFA', '#2A0A1A', 33);

-- ============================================================
-- 优惠类型 (21 条)
-- ============================================================

INSERT INTO discount_types (code, name, category, short_desc, format_template, input_prompts, fields, sort_order) VALUES
('spend-reduce', '购物满减', '价格优惠', '满1000减200', '满{spend}元减{reduce}元', '请输入满减金额门槛和减免金额',
'[{"key":"spend","label":"满（元）","type":"number","placeholder":"例如: 1000"},{"key":"reduce","label":"减（元）","type":"number","placeholder":"例如: 200"}]', 1),

('discount-rate', '折扣优惠', '价格优惠', '全场商品8.8折', '{item}{rate}', '请输入折扣率和适用商品',
'[{"key":"rate","label":"折扣率","type":"text","placeholder":"例如: 8.8折"},{"key":"item","label":"适用商品","type":"text","placeholder":"例如: 全场商品"}]', 2),

('fixed-price', '一口价/爆款价', '价格优惠', '18K金项链仅售999元', '{item}仅售{price}元', '请输入商品名称和一口价',
'[{"key":"price","label":"价格（元）","type":"number","placeholder":"例如: 999"},{"key":"item","label":"商品名称","type":"text","placeholder":"例如: 18K金项链"}]', 3),

('multi-discount', '多买多折', '价格优惠', '买2件享8折', '买{condition}享{discount}', '请输入多买多折的购买条件和折扣力度',
'[{"key":"condition","label":"购买条件","type":"text","placeholder":"例如: 买2件"},{"key":"discount","label":"折扣","type":"text","placeholder":"例如: 8折"}]', 4),

('second-half', '第二件半价', '价格优惠', '全场银饰第二件半价', '{item}第二件半价', '请输入适用商品',
'[{"key":"item","label":"适用商品","type":"text","placeholder":"例如: 全场银饰"},{"key":"description","label":"活动描述","type":"text","placeholder":"例如: 第二件半价"}]', 5),

('tiered-spend', '阶梯满减', '价格优惠', '满1000减100，满2000减300', '{tier1}，{tier2}', '请输入阶梯满减各档位信息',
'[{"key":"tier1","label":"第一档","type":"text","placeholder":"满1000减100"},{"key":"tier2","label":"第二档","type":"text","placeholder":"满2000减300"},{"key":"tier3","label":"第三档","type":"text","placeholder":"满5000减1000（可选）"}]', 6),

('buy-give', '买赠活动', '赠品活动', '买任一款赠银饰手链', '买{buyCondition}赠{gift}', '请输入购买条件和赠品信息',
'[{"key":"buyCondition","label":"购买条件","type":"text","placeholder":"例如: 购买任一款"},{"key":"gift","label":"赠品","type":"text","placeholder":"例如: 银饰手链"}]', 7),

('full-gift', '满额送礼', '赠品活动', '满2000元送珍珠耳钉', '满{spend}元送{gift}', '请输入消费门槛和赠品信息',
'[{"key":"spend","label":"消费门槛（元）","type":"number","placeholder":"例如: 2000"},{"key":"gift","label":"礼品","type":"text","placeholder":"例如: 珍珠耳钉"}]', 8),

('trade-in', '以旧换新', '赠品活动', '旧金饰换新款足金', '{oldItem}换{newItem}，{extra}', '请输入以旧换新的旧物、新品和加价说明',
'[{"key":"oldItem","label":"旧物","type":"text","placeholder":"例如: 旧金饰"},{"key":"newItem","label":"新品","type":"text","placeholder":"例如: 新款足金"},{"key":"extra","label":"加价说明","type":"text","placeholder":"例如: 旧金饰换新款补贴100元"}]', 9),

('member-only', '会员专享价', '会员营销', '注册会员享双倍积分', '{condition}享{benefit}', '请输入会员权益和条件',
'[{"key":"benefit","label":"会员权益","type":"text","placeholder":"例如: 双倍积分"},{"key":"condition","label":"会员条件","type":"text","placeholder":"例如: 注册会员"}]', 10),

('points-exchange', '积分兑换', '会员营销', '10000积分兑换珍珠项链', '{points}积分兑换{item}', '请输入所需积分和兑换商品',
'[{"key":"points","label":"所需积分","type":"number","placeholder":"例如: 10000"},{"key":"item","label":"兑换商品","type":"text","placeholder":"例如: 珍珠项链"}]', 11),

('new-member', '新人专享', '会员营销', '注册即领首单立减200', '{condition} {benefit}', '请输入新人专享权益和领取条件',
'[{"key":"benefit","label":"新人权益","type":"text","placeholder":"例如: 首单立减200"},{"key":"condition","label":"领取条件","type":"text","placeholder":"例如: 注册即领"}]', 12),

('store-card', '储值卡优惠', '会员营销', '充值2000送200', '{recharge}送{bonus}', '请输入充值金额和赠送金额',
'[{"key":"recharge","label":"充值金额","type":"text","placeholder":"例如: 充值2000"},{"key":"bonus","label":"赠送金额","type":"text","placeholder":"例如: 送200"}]', 13),

('flash-sale', '限时秒杀', '促销活动', '8月1日20:00限量款手镯仅299元', '{time} {item} {price}', '请输入秒杀时间、商品和价格',
'[{"key":"time","label":"秒杀时间","type":"text","placeholder":"例如: 8月1日 20:00"},{"key":"item","label":"秒杀商品","type":"text","placeholder":"例如: 限量款手镯"},{"key":"price","label":"秒杀价","type":"text","placeholder":"例如: 仅299元"}]', 14),

('group-buy', '拼团优惠', '促销活动', '3人团指定款项链仅999元', '{people}拼团{item}仅{price}', '请输入成团人数、价格和商品',
'[{"key":"people","label":"成团人数","type":"text","placeholder":"例如: 3人团"},{"key":"price","label":"拼团价","type":"text","placeholder":"例如: 999元"},{"key":"item","label":"拼团商品","type":"text","placeholder":"例如: 指定款项链"}]', 15),

('combo-deal', '组合套餐', '促销活动', '项链+手链+耳钉组合套餐1999', '{items}组合套餐{price}', '请输入套餐包含商品和价格',
'[{"key":"items","label":"套餐内容","type":"text","placeholder":"例如: 项链+手链+耳钉"},{"key":"price","label":"套餐价","type":"text","placeholder":"例如: 原价2999套餐价1999"}]', 16),

('coupon', '优惠券领取', '促销活动', '领满500减100优惠券到店扫码', '领{amount}优惠券{way}', '请输入优惠券面额和领取方式',
'[{"key":"amount","label":"优惠券面额","type":"text","placeholder":"例如: 满500减100"},{"key":"way","label":"领取方式","type":"text","placeholder":"例如: 到店扫码领取"}]', 17),

('lucky-draw', '抽奖活动', '促销活动', '消费满500元抽金条大奖', '{condition}参与抽奖{prizes}', '请输入参与条件和奖品信息',
'[{"key":"condition","label":"参与条件","type":"text","placeholder":"例如: 消费满500元"},{"key":"prizes","label":"奖品","type":"text","placeholder":"例如: 抽金条大奖"}]', 18),

('deposit-expand', '定金膨胀', '金融方案', '交100元定金抵300元', '交{deposit}元定金{expand}', '请输入定金金额和膨胀权益',
'[{"key":"deposit","label":"定金（元）","type":"number","placeholder":"例如: 100"},{"key":"expand","label":"膨胀倍数","type":"text","placeholder":"例如: 抵300元"},{"key":"item","label":"适用商品","type":"text","placeholder":"例如: 全场商品"}]', 19),

('installment', '分期免息', '金融方案', '指定款珠宝12期分期免息', '{item}{period}分期免息', '请输入分期期数和适用商品',
'[{"key":"period","label":"分期期数","type":"text","placeholder":"例如: 12期"},{"key":"item","label":"适用商品","type":"text","placeholder":"例如: 指定款珠宝"}]', 20),

('custom-text', '其他自定义', '其他', '用户自由输入活动文案', '{customContent}', '请输入自定义活动文案',
'[{"key":"customContent","label":"自定义文案","type":"text","placeholder":"直接输入活动描述，例如：黄金928元/克，满10克享受一克优惠"}]', 21);

-- ============================================================
-- 商户模板 (3 条)
-- ============================================================

INSERT INTO merchants (name, address, phone, is_default) VALUES
('周大福珠宝旗舰店', '周大福(五一广场店)', '13315834493', 1),
('周六福长沙总店', '周六福(北辰店)', '15512469911', 1),
('中国黄金朝阳区分店', '中国黄金(朝阳万达广场店)', '19933199739', 1);

-- ============================================================
-- 节日背景设计配置 (13 条)
-- ============================================================

INSERT INTO festival_designs (festival_code, color_desc, decoration_desc, prohibition) VALUES
('spring-festival', '以红色为主色调，从深红渐变到亮红，搭配鎏金色点缀', '画面四周和边缘装饰红灯笼、祥云、烟花、鞭炮、福字、春联剪影、金色元宝、红宝石闪光、金珠散落等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', '严禁出现绿色、蓝色等非春节配色'),
('yuanxiao', '以暖橙红色为主色调，搭配金色点缀', '画面四周和边缘装饰花灯、圆月、祥云、汤圆、灯谜条幅、珍珠光点、金色吊坠、琥珀散光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('dragon-boat', '以翠绿色为主色调，从深绿渐变到青绿，搭配金色点缀', '画面四周和边缘装饰粽叶、水波纹、龙舟剪影、粽子、艾草、香囊、翡翠光泽、金色细链、绿松石光点等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', '严禁出现红灯笼、春联等春节元素'),
('mid-autumn', '以深蓝夜空色为主色调，搭配银白月光和金色点缀', '画面四周和边缘装饰圆月、桂花枝、祥云、玉兔、月饼、嫦娥剪影、钻石星辉、月光石光泽、银色星点等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('chongyang', '以暖黄、橙色为主色调，搭配金色点缀', '画面四周和边缘装饰菊花、山峦、仙鹤、茱萸、酒杯、风筝、琥珀光泽、金色饰纹、蜜蜡光晕等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('laban', '以暖红、深棕为主色调，搭配金色点缀', '画面四周和边缘装饰窗花、年画纹样、腊八粥碗、五谷杂粮、红玛瑙光泽、金色祥云、朱砂光点等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('qingming', '以嫩绿色、浅青色为主色调，搭配淡金色点缀', '画面四周和边缘装饰柳枝、纸鸢、桃花、燕子、青团、踏青人物剪影、翡翠淡绿光晕、银白细链等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('winter-solstice', '以深蓝、银白为主色调，搭配金色暖光点缀', '画面四周和边缘装饰雪花、梅花、饺子、汤圆、冰晶、冬青枝、雪花形钻石闪光、银色冰晶纹理、铂金光泽等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('double-holiday', '以红色和墨绿色为主色调，上下分区，搭配鎏金色点缀', '上半区装饰元旦元素（烟花、金马、礼炮、气球），下半区装饰圣诞元素（冬青、铃铛、圣诞树、雪花），以及钻石闪光、金色吊坠等珠宝元素', '红绿色块严格分区，不交错混搭'),
('new-arrival-autumn', '以暖黄色为主色调，搭配橙色和鎏金色点缀', '画面四周和边缘装饰枫叶、麦穗、稻穗、南瓜、秋叶飘落、金色麦穗纹理、琥珀暖光、金箔散落等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('valentine', '以粉红色为主色调，从浅粉渐变到玫瑰红，搭配金色点缀', '画面四周和边缘装饰玫瑰花瓣、爱心、蝴蝶结、巧克力、情书、丘比特剪影、粉水晶光泽、玫瑰金细链、红宝石散光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', '严禁出现绿色、蓝色等冷色调'),
('white-valentine', '以淡粉色和白色为主色调，从纯白渐变到浅粉，搭配银色点缀', '画面四周和边缘装饰白色玫瑰、蝴蝶结、蕾丝纹理、白色巧克力、棉花、珍珠光泽、银白细链、钻石碎光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL),
('520-day', '以玫红色为主色调，从深粉渐变到炽热红，搭配金色点缀', '画面四周和边缘装饰爱心、玫瑰、星光、气球、情书、告白气球、红宝石光泽、金色心形吊坠、粉钻闪光等节日与珠宝元素，装饰要精致华丽但不遮挡中央文字', NULL);

-- ============================================================
-- 视觉风格 (8 条)
-- ============================================================

INSERT INTO visual_styles (code, name, description, short_desc, bg_desc, negative_prompt, sort_order) VALUES
('business', '商务高端', '高端商务招聘海报视觉体系，主配色深藏蓝基底+暖金色点缀+米白文字区', '深藏蓝渐变背景+皮革纹理+暖金色L型角花+盾牌徽章+菱形分隔符+底部金色光带，高端商务质感', '深藏蓝到石墨黑对角渐变，叠加细腻皮革纹理，四角暖金色L型金属角花装饰，左上角盾牌徽章位，右侧3-4条暖金色竖向装饰线，底部暖金色渐变光带横贯，无文字，深藏蓝大面积留白，高端商务视觉背景', NULL, 1),
('minimal', '极简风格', '现代极简招聘海报视觉体系，主配色纯白基底+炭黑文字+一个亮色强调', '纯白背景+炭黑大标题+左对齐粗横线+左下角几何色块强调+大量留白，克制而高级', '纯白底，右下角极淡灰色渐变阴影，标题下方一条粗炭黑横线左对齐占画面60%，左下角一个小几何色块，右侧边缘竖排极小灰色装饰文字，底部极细炭黑底线，无文字，超大面积纯白留白，极简高级视觉背景', NULL, 2),
('tech', '科技未来', '赛博科技招聘海报视觉体系，主配色深空黑基底+电光青+靛紫辉光', '深空黑背景+六边形蜂窝网格+电光青发光脉冲竖线+电路板走线+数据粒子浮动+靛紫三角光晕，沉浸式赛博科技', '深黑到深蓝径向渐变，中心电光青和靛紫双色光晕交融，背景密布六边形蜂窝网格线条从中心辐射，左侧一条电光青发光竖线带亮节点，四角靛紫三角光晕，中部10-15个电光青发光圆点散布，底部3-4个半透明六边形装饰框，无文字，赛博科技视觉背景', NULL, 3),
('chinese', '国潮中式', '竖版中式书画立轴招聘海报，严格竖向从上到下单列排版', '竖版从上到下严格单列排版；外框暗深檀红复古厚重色调，内层米白宣纸基底；顶部双龙戏珠鎏金匾额内超大醒目金色毛笔书法标题，中间金边牌匾框从上到下排列，底部小楷落款；红金水墨新中式卷轴国风', '竖版中式立轴卷轴基底，外层暗深檀红复古厚重边框，内层米白宣纸做旧肌理，四角回纹边框，顶部预留双龙浮雕匾额位，侧边祥云纹样，底部淡墨远山、湖面扁舟、写意青竹装饰，无任何文字，东方书画雅致背景', '纯平整红底，纯色无分层背景，无宣纸，无山水，横向排列，左右并排，网格布局，文字太小不醒目', 4),
('fresh', '小清新', '自然清新招聘海报视觉体系，主配色奶白基底+鼠尾草绿+暖杏色', '奶白底+大面积水彩晕染+左上尤加利叶手绘插画+右下干花插画+手绘波浪线分隔+飘落树叶，春日花园清新感', '奶白底，左上角和右下角大面积鼠尾草绿与暖杏交融水彩晕染色块，左上角手绘尤加利叶水彩插画，右下角干花蒲公英水彩插画，底部飘落树叶剪影，无文字，春日花园清新视觉背景', NULL, 5),
('magazine', '杂志编辑', '时尚杂志招聘海报视觉体系，主配色米白铜版纸基底+纯黑大色块+深红强调色', '米白铜版纸底+顶部纯黑标题栏+深红标签+左侧贯穿红线+数字编号+杂志页码标记，高端杂志版式感', '米白底叠加杂志铜版纸光泽质感，顶部纯黑色块占22%高度，深红色色块标签，左侧贯穿深红色粗竖线，3个白色圆圈数字编号，黑色方块页码标记，深红双细线分隔，无文字，黑白红三色对比，高端杂志视觉背景', NULL, 6),
('illustration', '插画风格', '扁平插画招聘海报视觉体系，主配色奶油黄基底+钴蓝+珊瑚橙', '奶油黄底+几何色块拼贴+手绘办公桌图标+对话气泡+扁平小图标散布+底部三角彩旗串，活泼手绘插画感', '奶油黄底，珊瑚橙和钴蓝几何色块拼贴，手绘卡通办公桌插画，珊瑚橙对话气泡框，扁平小图标散布，底部手绘三角彩旗串，无文字，活泼插画视觉背景', NULL, 7),
('vibrant', '鲜艳活力', '潮流活力招聘海报视觉体系，主配色亮紫基底+荧光黄+亮粉撞色', '亮紫渐变底+涂鸦喷溅色块+手绘星星爆炸装饰+霓虹圆环+马克笔对角线+底部皇冠图标，街头潮牌冲击力', '亮紫到深紫对角渐变，中心荧光黄和亮粉放射状涂鸦喷溅色块，手绘星星爆炸形状，亮粉不规则对角涂鸦线条，霓虹小圆环发光，底部手绘小皇冠奖杯图标，无文字，潮流街头视觉背景', NULL, 8);

-- ============================================================
-- 艺术风格 (22 条)
-- ============================================================

INSERT INTO art_styles (code, name, prompt_text, sort_order) VALUES
('chinese-ink', '水墨画', 'redraw this image in traditional Chinese ink painting style, elegant brushstrokes, ink wash texture, classical Chinese art aesthetic, preserve composition and subjects', 1),
('anime', '动漫风', 'redraw this image in Japanese anime illustration style, vibrant colors, clean lines, anime shading, detailed character art, preserve composition and subjects', 2),
('watercolor', '水彩画', 'redraw this image in watercolor painting style, soft washes, fluid colors, paper texture visible, artistic watercolor technique, preserve composition and subjects', 3),
('oil-painting', '油画', 'redraw this image in classical oil painting style, rich textures, visible brushstrokes, warm color palette, Renaissance masters technique, preserve composition and subjects', 4),
('cyberpunk', '赛博朋克', 'redraw this image in cyberpunk style, neon lights, futuristic elements, dark atmosphere with glowing accents, high-tech aesthetic, preserve composition and subjects', 5),
('minimalist', '极简主义', 'redraw this image in minimalist modern style, clean lines, simple shapes, limited color palette, negative space, contemporary design aesthetic, preserve composition and subjects', 6),
('fantasy', '梦幻奇幻', 'redraw this image in fantasy dreamlike style, magical atmosphere, ethereal lighting, sparkles and glow effects, surreal dreamworld, preserve composition and subjects', 7),
('black-white', '黑白艺术', 'redraw this image in black and white art style, high contrast, dramatic shadows, monochrome, fine details in grayscale, preserve composition and subjects', 8),
('steampunk', '蒸汽朋克', 'redraw this image in steampunk style, Victorian-era industrial elements, brass and copper tones, gears and mechanical details, retro-futuristic, preserve composition and subjects', 9),
('pixel-art', '像素风', 'redraw this image in pixel art style, retro 16-bit game aesthetic, limited color palette, visible pixels, nostalgic gaming look, preserve composition and subjects', 10),
('new-chinese', '新中式', 'redraw this image in new Chinese style, modern Chinese interior design aesthetic, subtle traditional elements, elegant muted colors, contemporary oriental, preserve composition and subjects', 11),
('nordic', '北欧风', 'redraw this image in Scandinavian minimalist style, light muted tones, natural materials, cozy clean aesthetic, Nordic design principles, preserve composition and subjects', 12),
('warm-vintage', '暖复古', 'apply warm vintage color grading to this image, golden warm tones, slightly faded highlights, rich amber shadows, nostalgic warm atmosphere, preserve all content and composition', 13),
('cool-tone', '冷色调', 'apply cool blue color grading to this image, cold blue tones, crisp icy highlights, desaturated warm colors, modern sleek look, preserve all content and composition', 14),
('high-saturation', '高饱和', 'apply high saturation vivid color grading to this image, boost all colors to be rich and vibrant, punchy vivid tones, enhanced color depth, preserve all content and composition', 15),
('morandi', '莫兰迪', 'apply Morandi color grading to this image, muted dusty tones, low saturation pastel colors, soft grey undertones, elegant muted palette, preserve all content and composition', 16),
('film-grain', '胶片感', 'apply film grain analog photography look to this image, subtle grain texture, slightly faded blacks, warm shadows, classic analog film color science, preserve all content and composition', 17),
('hdr', 'HDR', 'apply HDR high dynamic range effect to this image, enhanced details in shadows and highlights, rich contrast, vivid colors, dramatic lighting, preserve all content and composition', 18),
('soft-light', '柔光梦幻', 'apply soft light dreamy effect to this image, gentle diffused lighting, soft glowing highlights, pastel undertones, ethereal gentle atmosphere, preserve all content and composition', 19),
('dark-tone', '暗调', 'apply dark moody color grading to this image, deep shadows, low key lighting, rich dark tones, dramatic atmospheric mood, preserve all content and composition', 20),
('japanese-fresh', '日系清新', 'apply Japanese fresh clean color grading to this image, light airy tones, bright highlights, soft greens and blues, clean aesthetic, preserve all content and composition', 21),
('vintage-film', '复古胶片', 'apply vintage film photography look to this image, warm faded tones, light leaks, slightly yellowed highlights, retro 70s film color palette, preserve all content and composition', 22);
