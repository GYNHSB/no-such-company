import type { BrowserSite } from '@/stores/laptopStore'

/** 브라우저의 사이트마다 탭과 즐겨찾기에 보이는 이름, 아이콘 글자, 주소. 가상 주소는 `.example`로 끝난다 */
export const SITE_META: Record<BrowserSite, { name: string; favicon: string; address: string }> = {
  jobsite: { name: '구직로그', favicon: '구', address: 'gujiklog.example' },
  mail: { name: '받은편지함', favicon: '메', address: 'mail.example' },
  search: { name: '찾아봄', favicon: '찾', address: 'chajabom.example' },
}
