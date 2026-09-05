(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GlobalSitesData = api;
})(typeof window !== 'undefined' ? window : globalThis, () => {
  const countries = [
    ['china','中国','China'], ['usa','美国','United States'], ['japan','日本','Japan'], ['south-korea','韩国','South Korea'], ['uk','英国','United Kingdom'], ['france','法国','France'], ['germany','德国','Germany'], ['singapore','新加坡','Singapore'], ['india','印度','India'], ['indonesia','印度尼西亚','Indonesia'], ['canada','加拿大','Canada'], ['australia','澳大利亚','Australia'], ['global','全球','Global']
  ].map(([id, nameZh, nameEn]) => ({ id, nameZh, nameEn }));
  const categories = [
    ['entertainment','影视娱乐','Entertainment'], ['shopping','网络购物','Shopping'], ['jobs','找工作','Jobs'], ['ai','人工智能','AI'], ['cloud','云计算','Cloud'], ['short-video-live','短视频与直播','Short video & live'], ['social-search','社交','Social'], ['search-engine','搜索引擎','Search engines']
  ].map(([id, nameZh, nameEn]) => ({ id, nameZh, nameEn }));
  const companies = [
    ['google','谷歌','Google','https://about.google/'], ['meta','Meta','Meta','https://about.meta.com/'], ['microsoft','微软','Microsoft','https://www.microsoft.com/'], ['amazon','亚马逊','Amazon','https://www.aboutamazon.com/'], ['bytedance','字节跳动','ByteDance','https://www.bytedance.com/'], ['alibaba','阿里巴巴','Alibaba','https://www.alibabagroup.com/'], ['tencent','腾讯','Tencent','https://www.tencent.com/']
  ].map(([id, nameZh, nameEn, url]) => ({ id, nameZh, nameEn, url }));
  const sites = [
    ['bilibili',['china'],['entertainment','short-video-live'],'哔哩哔哩','Bilibili','中国视频社区与直播平台','Chinese video community and live platform','https://www.bilibili.com/'],
    ['iqiyi',['china'],['entertainment'],'爱奇艺','iQIYI','影视内容平台','Streaming entertainment platform','https://www.iqiyi.com/'],
    ['taobao',['china'],['shopping'],'淘宝','Taobao','综合网络购物平台','Online shopping marketplace','https://www.taobao.com/','alibaba'],
    ['zhaopin',['china'],['jobs'],'智联招聘','Zhaopin','招聘与求职平台','Recruitment and job-search platform','https://www.zhaopin.com/'],
    ['boss-zhipin',['china'],['jobs'],'Boss 直聘','BOSS Zhipin','中国招聘与求职平台','Chinese recruitment and job-search platform','https://www.zhipin.com/'],
    ['51job',['china'],['jobs'],'前程无忧（51job）','51job','中国招聘与求职平台','Chinese recruitment and job-search platform','https://www.51job.com/'],
    ['deepseek',['china'],['ai'],'DeepSeek','DeepSeek','人工智能模型与助手','AI models and assistant','https://www.deepseek.com/'],
    ['aliyun',['china'],['cloud'],'阿里云','Alibaba Cloud','云计算服务','Cloud computing services','https://www.aliyun.com/','alibaba'],
    ['douyin',['china'],['short-video-live'],'抖音','Douyin','短视频与直播平台','Short video and live platform','https://www.douyin.com/','bytedance'],
    ['wechat',['china'],['social-search'],'微信','WeChat','社交通信与服务平台','Social communication and services','https://weixin.qq.com/','tencent'],
    ['baidu',['china'],['search-engine'],'百度','Baidu','中国搜索引擎','Chinese search engine','https://www.baidu.com/'],
    ['netflix',['usa','uk','canada','australia'],['entertainment'],'奈飞','Netflix','影视流媒体服务','Streaming entertainment service','https://www.netflix.com/'],
    ['amazon-store',['usa','uk','germany','france','japan','india','canada','australia'],['shopping'],'亚马逊','Amazon','网络购物平台','Online shopping platform','https://www.amazon.com/','amazon'],
    ['linkedin',['usa','uk','france','germany','singapore','india','canada','australia'],['jobs','social-search'],'领英','LinkedIn','职业社交与招聘平台','Professional network and jobs platform','https://www.linkedin.com/','microsoft'],
    ['chatgpt',['usa','uk','france','germany','singapore','india','canada','australia','japan','south-korea'],['ai'],'ChatGPT','ChatGPT','人工智能助手','AI assistant','https://chatgpt.com/'],
    ['aws',['usa','uk','france','germany','singapore','india','japan','south-korea','canada','australia'],['cloud'],'亚马逊云科技','AWS','云计算服务','Cloud computing services','https://aws.amazon.com/','amazon'],
    ['youtube',['usa','uk','france','germany','singapore','india','japan','south-korea','canada','australia'],['entertainment','short-video-live'],'YouTube','YouTube','视频与直播平台','Video and live platform','https://www.youtube.com/','google'],
    ['google-search',['usa','uk','france','germany','singapore','india','japan','south-korea','canada','australia'],['search-engine'],'谷歌搜索','Google Search','网页搜索服务','Web search service','https://www.google.com/','google'],
    ['bing',['usa','uk','france','germany','singapore','india','japan','south-korea','canada','australia'],['search-engine'],'必应','Bing','网页搜索服务','Web search service','https://www.bing.com/','microsoft'],
    ['duckduckgo',['usa','uk','france','germany','singapore','india','japan','south-korea','canada','australia'],['search-engine'],'DuckDuckGo','DuckDuckGo','注重隐私的搜索引擎','Privacy-focused search engine','https://duckduckgo.com/'],
    ['rakuten',['japan'],['shopping'],'乐天市场','Rakuten Ichiba','日本网络购物平台','Japanese online marketplace','https://www.rakuten.co.jp/'],
    ['line',['japan','south-korea'],['social-search'],'LINE','LINE','通信与社交平台','Messaging and social platform','https://line.me/'],
    ['wantedly',['japan'],['jobs'],'Wantedly','Wantedly','职业社交与招聘平台','Professional networking and jobs','https://www.wantedly.com/'],
    ['coupang',['south-korea'],['shopping'],'Coupang','Coupang','韩国网络购物平台','Korean online marketplace','https://www.coupang.com/'],
    ['naver',['south-korea'],['search-engine'],'Naver','Naver','韩国搜索与内容平台','Korean search and content platform','https://www.naver.com/'],
    ['naver-cloud',['south-korea'],['cloud'],'NAVER Cloud','NAVER Cloud','云计算服务','Cloud computing services','https://www.ncloud.com/'],
    ['bbc-iplayer',['uk'],['entertainment'],'BBC iPlayer','BBC iPlayer','英国影视与节目平台','UK television and programme platform','https://www.bbc.co.uk/iplayer/'],
    ['asos',['uk'],['shopping'],'ASOS','ASOS','英国时尚购物平台','UK fashion shopping platform','https://www.asos.com/'],
    ['deepmind',['uk'],['ai'],'Google DeepMind','Google DeepMind','人工智能研究机构','AI research organisation','https://deepmind.google/','google'],
    ['mistral',['france'],['ai'],'Mistral AI','Mistral AI','法国人工智能公司','French AI company','https://mistral.ai/'],
    ['dailymotion',['france'],['entertainment','short-video-live'],'Dailymotion','Dailymotion','视频平台','Video platform','https://www.dailymotion.com/'],
    ['carrefour',['france'],['shopping'],'家乐福','Carrefour','法国零售与网络购物平台','French retail and online shopping','https://www.carrefour.fr/'],
    ['ovhcloud',['france'],['cloud'],'OVHcloud','OVHcloud','法国云计算服务','French cloud computing services','https://www.ovhcloud.com/'],
    ['zalando',['germany'],['shopping'],'Zalando','Zalando','德国时尚购物平台','German fashion shopping platform','https://www.zalando.de/'],
    ['stepstone',['germany'],['jobs'],'StepStone','StepStone','德国招聘平台','German job-search platform','https://www.stepstone.de/'],
    ['sap',['germany'],['cloud'],'SAP','SAP','企业云软件服务','Enterprise cloud software','https://www.sap.com/'],
    ['shopee',['singapore'],['shopping'],'Shopee','Shopee','东南亚网络购物平台','Southeast Asian shopping platform','https://shopee.sg/'],
    ['grab',['singapore'],['social-search'],'Grab','Grab','出行与本地生活服务','Mobility and local services','https://www.grab.com/'],
    ['tokopedia',['indonesia'],['shopping'],'Tokopedia','Tokopedia','印度尼西亚网络购物平台','Indonesian online marketplace','https://www.tokopedia.com/'],
    ['vidio',['indonesia'],['entertainment','short-video-live'],'Vidio','Vidio','印度尼西亚影视与直播平台','Indonesian streaming and live platform','https://www.vidio.com/'],
    ['kalibrr',['indonesia'],['jobs'],'Kalibrr','Kalibrr','印度尼西亚招聘平台','Indonesian job-search platform','https://www.kalibrr.com/'],
    ['naukri',['india'],['jobs'],'Naukri','Naukri','印度招聘平台','Indian job-search platform','https://www.naukri.com/'],
    ['flipkart',['india'],['shopping'],'Flipkart','Flipkart','印度网络购物平台','Indian online marketplace','https://www.flipkart.com/'],
    ['hotstar',['india'],['entertainment'],'JioHotstar','JioHotstar','印度影视流媒体平台','Indian streaming platform','https://www.jiohotstar.com/'],
    ['shopify',['canada'],['shopping','cloud'],'Shopify','Shopify','加拿大电商与云平台','Canadian commerce and cloud platform','https://www.shopify.com/'],
    ['cohere',['canada'],['ai'],'Cohere','Cohere','加拿大人工智能公司','Canadian AI company','https://cohere.com/'],
    ['seek',['australia'],['jobs'],'SEEK','SEEK','澳大利亚招聘平台','Australian job-search platform','https://www.seek.com.au/'],
    ['canva',['australia'],['ai','cloud'],'Canva','Canva','在线设计与人工智能工具','Online design and AI tools','https://www.canva.com/'],
    ['stan',['australia'],['entertainment'],'Stan','Stan','澳大利亚影视流媒体平台','Australian streaming platform','https://www.stan.com.au/']
  ].map(([id, countryIds, categoryIds, nameZh, nameEn, descriptionZh, descriptionEn, url, companyId]) => ({ id, countryIds, categoryIds, nameZh, nameEn, descriptionZh, descriptionEn, url, companyId }));
  const companyProducts = [
    ['google','Google','Google','搜索、广告与浏览器','Search, advertising, and browser','https://www.google.com/'], ['google','YouTube','YouTube','视频与直播产品','Video and live product','https://www.youtube.com/'], ['google','Gemini','Gemini','人工智能助手','AI assistant','https://gemini.google.com/'], ['google','Google Cloud','Google Cloud','云计算产品','Cloud computing product','https://cloud.google.com/'],
    ['meta','Facebook','Facebook','社交网络','Social network','https://www.facebook.com/'], ['meta','Instagram','Instagram','图片与短视频社区','Photos and short video community','https://www.instagram.com/'], ['meta','WhatsApp','WhatsApp','通信产品','Messaging product','https://www.whatsapp.com/'],
    ['microsoft','Windows','Windows','操作系统','Operating system','https://www.microsoft.com/windows/'], ['microsoft','LinkedIn','LinkedIn','职业社交平台','Professional network','https://www.linkedin.com/'], ['microsoft','Azure','Microsoft Azure','云计算产品','Cloud computing product','https://azure.microsoft.com/'],
    ['amazon','Amazon Store','Amazon Store','网络购物平台','Online shopping platform','https://www.amazon.com/'], ['amazon','AWS','AWS','云计算产品','Cloud computing product','https://aws.amazon.com/'], ['amazon','Twitch','Twitch','游戏直播平台','Game live-streaming platform','https://www.twitch.tv/'],
    ['bytedance','抖音','Douyin','中国短视频产品','China short-video product','https://www.douyin.com/'], ['bytedance','TikTok','TikTok','国际短视频产品','International short-video product','https://www.tiktok.com/'], ['bytedance','飞书','Lark','协作办公产品','Collaboration product','https://www.larksuite.com/'],
    ['alibaba','淘宝','Taobao','网络购物平台','Online shopping platform','https://www.taobao.com/'], ['alibaba','阿里云','Alibaba Cloud','云计算产品','Cloud computing product','https://www.alibabacloud.com/'], ['alibaba','钉钉','DingTalk','协作办公产品','Collaboration product','https://www.dingtalk.com/'],
    ['tencent','微信','WeChat','通信与服务产品','Messaging and services','https://weixin.qq.com/'], ['tencent','QQ','QQ','通信产品','Messaging product','https://im.qq.com/'], ['tencent','腾讯云','Tencent Cloud','云计算产品','Cloud computing product','https://cloud.tencent.com/']
  ].map(([companyId, nameZh, nameEn, descriptionZh, descriptionEn, url]) => ({ companyId, nameZh, nameEn, descriptionZh, descriptionEn, url }));
  const isSafeUrl = (url) => { try { return new URL(url).protocol === 'https:'; } catch (_) { return false; } };
  const filterSites = ({ countryId = 'all', categoryId = 'all', query = '' } = {}) => {
    const needle = String(query).trim().toLowerCase();
    return sites.filter((site) => (countryId === 'all' || site.countryIds.includes(countryId)) && (categoryId === 'all' || site.categoryIds.includes(categoryId)) && (!needle || [site.nameZh, site.nameEn, site.descriptionZh, site.descriptionEn].join(' ').toLowerCase().includes(needle)));
  };
  const productsForCompany = (companyId) => companyProducts.filter((product) => product.companyId === companyId);
  return { countries: countries.filter((country) => country.id !== 'global'), categories, companies, sites, companyProducts, filterSites, productsForCompany, isSafeUrl };
});
