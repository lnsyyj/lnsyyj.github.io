(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PublicServicePhonesData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const countries = [
    { id: 'china', nameZh: '中国', nameEn: 'China' },
    { id: 'united-states', nameZh: '美国', nameEn: 'United States' },
    { id: 'canada', nameZh: '加拿大', nameEn: 'Canada' },
    { id: 'united-kingdom', nameZh: '英国', nameEn: 'United Kingdom' },
    { id: 'france', nameZh: '法国', nameEn: 'France' },
    { id: 'germany', nameZh: '德国', nameEn: 'Germany' },
    { id: 'japan', nameZh: '日本', nameEn: 'Japan' },
    { id: 'south-korea', nameZh: '韩国', nameEn: 'South Korea' },
    { id: 'singapore', nameZh: '新加坡', nameEn: 'Singapore' },
    { id: 'australia', nameZh: '澳大利亚', nameEn: 'Australia' },
    { id: 'india', nameZh: '印度', nameEn: 'India' }
  ];
  const categories = [
    { id: 'emergency', nameZh: '紧急服务', nameEn: 'Emergency' },
    { id: 'public-service', nameZh: '公共服务', nameEn: 'Public service' },
    { id: 'bank', nameZh: '银行', nameEn: 'Bank' },
    { id: 'insurance', nameZh: '保险', nameEn: 'Insurance' }
  ];
  const chinaEmergencySource = 'https://www.enghunan.gov.cn/hneng/Services/QuickLinks/EmergencyContacts/202503/t20250320_1813835.html';
  const chinaServiceSource = 'https://bjca.miit.gov.cn/zwgk/tzgg/art/2022/art_8d4eb93ee3424f30826c97ee400e8937.html';
  const phoneRecords = [
    { id: 'china-police-110', countryId: 'china', categoryId: 'emergency', institutionZh: '公安报警', institutionEn: 'Police emergency', phone: '110', descriptionZh: '刑事和治安案件报警、紧急求助。', descriptionEn: 'Police emergency and urgent assistance.', sourceUrl: chinaEmergencySource, verifiedAt: '2026-09-05' },
    { id: 'china-fire-119', countryId: 'china', categoryId: 'emergency', institutionZh: '消防救援', institutionEn: 'Fire and rescue', phone: '119', descriptionZh: '火警、火灾救援。', descriptionEn: 'Fire and rescue emergency.', sourceUrl: chinaEmergencySource, verifiedAt: '2026-09-05' },
    { id: 'china-medical-120', countryId: 'china', categoryId: 'emergency', institutionZh: '医疗急救', institutionEn: 'Medical emergency', phone: '120', descriptionZh: '医疗急救。', descriptionEn: 'Medical emergency assistance.', sourceUrl: chinaEmergencySource, verifiedAt: '2026-09-05' },
    { id: 'china-traffic-122', countryId: 'china', categoryId: 'emergency', institutionZh: '交通事故报警', institutionEn: 'Traffic accident police', phone: '122', descriptionZh: '道路交通事故报警。', descriptionEn: 'Road traffic accident reporting.', sourceUrl: chinaEmergencySource, verifiedAt: '2026-09-05' },
    { id: 'united-states-emergency-911', countryId: 'united-states', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '911', descriptionZh: '警察、消防和医疗紧急情况。', descriptionEn: 'Police, fire and medical emergencies.', sourceUrl: 'https://www.usa.gov/911-emergency', verifiedAt: '2026-09-05' },
    { id: 'canada-emergency-911', countryId: 'canada', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '911', descriptionZh: '紧急求助服务。', descriptionEn: 'Emergency assistance.', sourceUrl: 'https://www.canada.ca/en/public-safety-canada/services/911.html', verifiedAt: '2026-09-05' },
    { id: 'united-kingdom-emergency-999-112', countryId: 'united-kingdom', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '999 / 112', descriptionZh: '全国紧急响应服务。', descriptionEn: 'National emergency response service.', sourceUrl: 'https://www.gov.uk/guidance/999-and-112-the-uks-national-emergency-numbers', verifiedAt: '2026-09-05' },
    { id: 'france-emergency-112', countryId: 'france', categoryId: 'emergency', institutionZh: '欧洲紧急号码', institutionEn: 'European emergency number', phone: '112', descriptionZh: '紧急服务求助。', descriptionEn: 'Emergency service assistance.', sourceUrl: 'https://www.service-public.fr/particuliers/actualites/A17758?lang=fr', verifiedAt: '2026-09-05' },
    { id: 'germany-emergency-110-112', countryId: 'germany', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '110 / 112', descriptionZh: '警方及消防、急救紧急电话。', descriptionEn: 'Police, fire and medical emergency numbers.', sourceUrl: 'https://www.bbk.bund.de/SharedDocs/Downloads/EN/Mediathek/Publikationen/ratgeber-englisch-disasters-alarm.pdf?__blob=publicationFile', verifiedAt: '2026-09-05' },
    { id: 'japan-emergency-110-119', countryId: 'japan', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '110 / 119', descriptionZh: '警察及消防、救护紧急电话。', descriptionEn: 'Police, fire and ambulance emergency numbers.', sourceUrl: 'https://www.gov-online.go.jp/video/cao/dl/public_html/gov/pdf/hlj/20130301/22-23.pdf', verifiedAt: '2026-09-05' },
    { id: 'south-korea-emergency-112-119', countryId: 'south-korea', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '112 / 119', descriptionZh: '警察及消防、急救紧急电话。', descriptionEn: 'Police, fire and medical emergency numbers.', sourceUrl: 'https://www.police.go.kr/eng/main.do', verifiedAt: '2026-09-06' },
    { id: 'singapore-emergency-999-995', countryId: 'singapore', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '999 / 995', descriptionZh: '警察及消防、救护紧急电话。', descriptionEn: 'Police, fire and ambulance emergency numbers.', sourceUrl: 'https://www.mom.gov.sg/-/media/mom/documents/publications/guides/mdw-handy-guide-english-burmese.pdf', verifiedAt: '2026-09-05' },
    { id: 'australia-emergency-000', countryId: 'australia', categoryId: 'emergency', institutionZh: '紧急服务', institutionEn: 'Emergency services', phone: '000', descriptionZh: '紧急情况请拨打三零零。', descriptionEn: 'Call Triple Zero in an emergency.', sourceUrl: 'https://www.triplezero.gov.au/Documents/Poster%20-%20Triple%20Zero%20-%20ENGLISH.PDF', verifiedAt: '2026-09-05' },
    { id: 'india-emergency-112', countryId: 'india', categoryId: 'emergency', institutionZh: '紧急响应系统', institutionEn: 'Emergency Response Support System', phone: '112', descriptionZh: '全国统一紧急响应号码。', descriptionEn: 'Pan-India single emergency response number.', sourceUrl: 'https://112.gov.in/', verifiedAt: '2026-09-05' },
    { id: 'china-government-12345', countryId: 'china', categoryId: 'public-service', institutionZh: '政府服务热线', institutionEn: 'Government service hotline', phone: '12345', descriptionZh: '帮助企业和群众解决生活、生产困难。', descriptionEn: 'Government service assistance for residents and businesses.', sourceUrl: chinaServiceSource, verifiedAt: '2026-09-05' },
    { id: 'china-human-resources-12333', countryId: 'china', categoryId: 'public-service', institutionZh: '人力资源和社会保障服务', institutionEn: 'Human resources and social security service', phone: '12333', descriptionZh: '劳动保障政策咨询、举报投诉和社保查询。', descriptionEn: 'Labour and social-security information and enquiries.', sourceUrl: chinaServiceSource, verifiedAt: '2026-09-05' },
    { id: 'china-railway-12306', countryId: 'china', categoryId: 'public-service', institutionZh: '中国铁路客户服务', institutionEn: 'China Railway customer service', phone: '12306', descriptionZh: '铁路客运信息和服务。', descriptionEn: 'Rail passenger information and services.', sourceUrl: chinaServiceSource, verifiedAt: '2026-09-05' },
    { id: 'china-market-regulation-12315', countryId: 'china', categoryId: 'public-service', institutionZh: '市场监管服务', institutionEn: 'Market regulation service', phone: '12315', descriptionZh: '市场监管服务。', descriptionEn: 'Market regulation service hotline.', sourceUrl: 'https://www.enghunan.gov.cn/hneng/Services/QuickLinks/EmergencyContacts/202503/t20250320_1813835.html', verifiedAt: '2026-09-05' },
    { id: 'china-icbc-95588', countryId: 'china', categoryId: 'bank', institutionZh: '中国工商银行', institutionEn: 'Industrial and Commercial Bank of China', phone: '95588', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://www.icbc.com.cn/column/1438058319784067120.html', verifiedAt: '2026-09-05' },
    { id: 'china-abc-95599', countryId: 'china', categoryId: 'bank', institutionZh: '中国农业银行', institutionEn: 'Agricultural Bank of China', phone: '95599', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://www.abchina.com/cn/AboutABC/yszc/gryszc/201912/W020201120565342426521.pdf', verifiedAt: '2026-09-05' },
    { id: 'china-boc-95566', countryId: 'china', categoryId: 'bank', institutionZh: '中国银行', institutionEn: 'Bank of China', phone: '95566', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://95566.boc.cn/mccmmg-bocweb/igtbnet/index.html?channel=3&language=zh_CN', verifiedAt: '2026-09-05' },
    { id: 'china-ccb-95533', countryId: 'china', categoryId: 'bank', institutionZh: '中国建设银行', institutionEn: 'China Construction Bank', phone: '95533', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://login3.ccb.com/chn/home/customer_service/customer_service.shtml', verifiedAt: '2026-09-05' },
    { id: 'china-bocom-95559', countryId: 'china', categoryId: 'bank', institutionZh: '交通银行', institutionEn: 'Bank of Communications', phone: '95559', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://www.bankcomm.com/BankCommSite/simple/cn/lxwm/index.html', verifiedAt: '2026-09-05' },
    { id: 'china-cmb-95555', countryId: 'china', categoryId: 'bank', institutionZh: '招商银行', institutionEn: 'China Merchants Bank', phone: '95555', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://cmbchina.com/', verifiedAt: '2026-09-05' },
    { id: 'china-citic-95558', countryId: 'china', categoryId: 'bank', institutionZh: '中信银行', institutionEn: 'China CITIC Bank', phone: '95558', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://www.citicbank.com/about/investor/notice/ashare/202503/P020250326696660745377.pdf', verifiedAt: '2026-09-05' },
    { id: 'china-ceb-95595', countryId: 'china', categoryId: 'bank', institutionZh: '中国光大银行', institutionEn: 'China Everbright Bank', phone: '95595', descriptionZh: '客户服务热线。', descriptionEn: 'Customer service hotline.', sourceUrl: 'https://xykimg.cebbank.com/upload/vip/20161230/tyb.pdf', verifiedAt: '2026-09-05' },
    { id: 'china-picc-95518', countryId: 'china', categoryId: 'insurance', institutionZh: '中国人民保险', institutionEn: 'PICC', phone: '95518', descriptionZh: '全国统一客户服务热线。', descriptionEn: 'Nationwide customer service hotline.', sourceUrl: 'https://property.picc.com/fuwu/chaxunbaoxiantiaokuan/yiwaibaoxian/202201/rrakgrb.pdf', verifiedAt: '2026-09-06' },
    { id: 'china-life-95519', countryId: 'china', categoryId: 'insurance', institutionZh: '中国人寿', institutionEn: 'China Life', phone: '95519', descriptionZh: '保险服务热线。', descriptionEn: 'Insurance service hotline.', sourceUrl: 'https://www.e-chinalife.com/xxpl/gywm/gsjs/', verifiedAt: '2026-09-05' },
    { id: 'china-cpic-95500', countryId: 'china', categoryId: 'insurance', institutionZh: '中国太平洋保险', institutionEn: 'China Pacific Insurance', phone: '95500', descriptionZh: '保险服务热线。', descriptionEn: 'Insurance service hotline.', sourceUrl: 'https://life.cpic.com.cn/life/cn/lxwm/', verifiedAt: '2026-09-05' },
    { id: 'china-ping-an-95511', countryId: 'china', categoryId: 'insurance', institutionZh: '平安保险', institutionEn: 'Ping An Insurance', phone: '95511', descriptionZh: '保险服务热线。', descriptionEn: 'Insurance service hotline.', sourceUrl: 'https://www.pingan.com/homepage/contact.shtml', verifiedAt: '2026-09-05' },
    { id: 'china-new-china-life-95567', countryId: 'china', categoryId: 'insurance', institutionZh: '新华保险', institutionEn: 'New China Life', phone: '95567', descriptionZh: '保险服务热线。', descriptionEn: 'Insurance service hotline.', sourceUrl: 'https://www.newchinalife.com/?isappinstalled=0', verifiedAt: '2026-09-05' },
    { id: 'china-taikang-95522', countryId: 'china', categoryId: 'insurance', institutionZh: '泰康保险', institutionEn: 'Taikang Insurance', phone: '95522', descriptionZh: '保险服务热线。', descriptionEn: 'Insurance service hotline.', sourceUrl: 'https://www.taikang.com/tktwentyfive/', verifiedAt: '2026-09-05' }
  ];
  const isSafePhone = (value) => typeof value === 'string' && /^[0-9+()\/\-\s]+$/.test(value);
  const isSafeUrl = (value) => {
    if (typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && Boolean(url.hostname);
    } catch {
      return false;
    }
  };
  const toTelHref = (value) => isSafePhone(value) ? `tel:${value.replace(/\s+/g, '')}` : null;
  const filterRecords = ({ countryId = '', categoryId = '', query = '' } = {}) => {
    const normalizedQuery = String(query).toLocaleLowerCase();
    return phoneRecords.filter((record) => (!countryId || record.countryId === countryId)
      && (!categoryId || record.categoryId === categoryId)
      && (!normalizedQuery || [record.institutionZh, record.institutionEn, record.descriptionZh, record.descriptionEn, record.phone]
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery))));
  };
  return { countries, categories, phoneRecords, filterRecords, isSafePhone, isSafeUrl, toTelHref };
});
