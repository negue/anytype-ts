import { I, Util } from 'ts/lib';
import { observable, intercept, makeObservable } from 'mobx';

class TableCell implements I.TableCell {
	
	value: string = '';
	horizontal: I.TableAlign = I.TableAlign.Left;
	vertical: I.TableAlign = I.TableAlign.Top;
	color: string = '';
	background: string = '';
	width: number = 0;
	
	constructor (props: I.TableCell) {
		let self = this;
		
		self.value = String(props.value || '');
		self.horizontal = Number(props.horizontal) || I.TableAlign.Left;
		self.vertical = Number(props.vertical) || I.TableAlign.Top;
		self.color = String(props.color || '');
		self.background = String(props.background || '');
		self.width = Number(props.width) || 0;
	};

};

class TableRow implements I.TableRow {
	
	cells: TableCell[] = [];
	
	constructor (props: I.TableRow) {
		let self = this;
		
		self.cells = (props.cells || []).map((it: I.TableCell) => { return new TableCell(it); });
	};

};

class BlockContentTable implements I.ContentTable {
	
	columnCount: number = 0;
	rows: I.TableRow[] = [];
	
	constructor (props: I.ContentTable) {
		let self = this;
		
		self.columnCount = Number(props.columnCount) || 0;
		self.rows = (props.rows || []).map((it: I.TableRow) => { return new TableRow(it); });

		makeObservable(self, {
			columnCount: observable,
			rows: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export {
	TableRow,
	TableCell,
	BlockContentTable,
};