import { I } from 'ts/lib';

export enum TableAlign {
	Left	 = 0,
	Right	 = 1,
	Center	 = 2,
	Top		 = 3,
	Bottom	 = 4,
};

export interface TableCell {
	value: string;
	horizontal: TableAlign;
	vertical: TableAlign;
	color: string;
	background: string;
	width: number;
};

export interface TableRow {
	cells: TableCell[];
};

export interface ContentTable {
	columnCount: number;
	rows: TableRow[];
};

export interface BlockTable extends I.Block {
	content: ContentTable;
};