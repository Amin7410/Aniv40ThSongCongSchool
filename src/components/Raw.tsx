/**
 * Chèn đồ họa SVG tĩnh của prototype (hằng số trong mã nguồn, KHÔNG BAO GIỜ dùng cho dữ liệu người dùng).
 * display:contents để không làm lệch bố cục CSS gốc.
 */
export function Raw({ html }: { html: string }) {
  // eslint-disable-next-line react/no-danger -- chỉ nhận hằng số SVG trong src/lib/proto-svg.ts
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
}
