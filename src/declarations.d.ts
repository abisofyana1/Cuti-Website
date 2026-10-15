declare module 'xlsx-js-style' {
  export const utils: {
    aoa_to_sheet: (data: any[][]) => any;
    book_new: () => any;
    book_append_sheet: (wb: any, ws: any, name: string) => void;
    decode_range: (ref: string) => { s: { r: number, c: number }, e: { r: number, c: number } };
    encode_cell: (cell: { r: number, c: number }) => string;
  };
  export const writeFile: (wb: any, filename: string) => void;
  
  const xlsx: any;
  export default xlsx;
}

declare module 'jspdf';

declare module 'jspdf-autotable' {
  const autoTable: any;
  export default autoTable;
}