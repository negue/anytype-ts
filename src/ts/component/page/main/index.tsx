import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Icon, IconObject, ListIndex, Cover, HeaderMainIndex as Header, FooterMainIndex as Footer, Filter } from 'ts/component';
import { commonStore, blockStore, detailStore, menuStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { I, C, Util, DataUtil, translate, crumbs, Storage, analytics } from 'ts/lib';
import arrayMove from 'array-move';
import { popupStore } from '../../../store';

interface Props extends RouteComponentProps<any> {}

interface State {
	tab: Tab;
	filter: string;
	pages: any[];
	loading: boolean;
};

const $ = require('jquery');
const Constant: any = require('json/constant.json');

enum Tab {
	None		 = '',
	Favorite	 = 'favorite',
	Recent		 = 'recent',
	Set			 = 'set',
	Space		 = 'space',
	Shared		 = 'shared',
	Archive		 = 'archive',
};

const PageMainIndex = observer(class PageMainIndex extends React.Component<Props, State> {
	
	refFilter: any = null;
	id: string = '';
	timeoutFilter: number = 0;
	selected: string[] = [];

	state = {
		tab: Tab.Favorite,
		filter: '',
		pages: [],
		loading: false,
	};

	constructor (props: any) {
		super(props);
		
		this.getList = this.getList.bind(this);
		this.onAccount = this.onAccount.bind(this);
		this.onProfile = this.onProfile.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onStore = this.onStore.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSearch = this.onSearch.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onSelectionDelete = this.onSelectionDelete.bind(this);
		this.onSelectionRestore = this.onSelectionRestore.bind(this);
		this.onSelectionAll = this.onSelectionAll.bind(this);
		this.onSelectionNone = this.onSelectionNone.bind(this);
		this.onSelectionClose = this.onSelectionClose.bind(this);
	};
	
	render () {
		const { cover, config } = commonStore;
		const { root, profile, recent } = blockStore;
		const element = blockStore.getLeaf(root, root);
		const { filter, loading } = this.state;
		const tabs = this.getTabs();
		const tab = tabs.find((it: any) => { return it.id == this.state.tab; });
		const canDrag = [ Tab.Favorite ].indexOf(tab.id) >= 0

		if (!element) {
			return null;
		};

		const object = detailStore.get(profile, profile, []);
		const { name } = object;
		const list = this.getList();

		const TabItem = (item: any) => (
			<div className={[ 'tab', (tab.id == item.id ? 'active' : '') ].join(' ')} onClick={(e: any) => { this.onTab(item.id); }}>
				{item.name}
			</div>
		);

		let content = null;
		if (!loading) {
			if (!list.length) {
				content = (
					<div className="emptySearch">
						There are no objects in {tab.name} tab
					</div>
				);
			} else {
				content = (
					<ListIndex 
						onClick={this.onClick} 
						onSelect={this.onSelect} 
						onAdd={this.onAdd}
						onMore={this.onMore}
						onSortStart={this.onSortStart}
						onSortEnd={this.onSortEnd}
						getList={this.getList}
						helperContainer={() => { return $('#documents').get(0); }} 
						canDrag={canDrag}
					/>
				);
			};
		};

		return (
			<div>
				<Cover {...cover} />
				<Header {...this.props} />
				<Footer {...this.props} />
				
				<div id="body" className="wrapper">
					<div id="title" className="title">
						{name ? Util.sprintf(translate('indexHi'), Util.shorten(name, 24)) : ''}
						
						<div className="rightMenu">
							<Icon id="button-account" className="account" tooltip="Accounts" onClick={this.onAccount} />
							<Icon id="button-add" className="add" tooltip="Add new object" onClick={this.onAdd} />
							<Icon id="button-store" className="store" tooltip="Library" onClick={this.onStore} />
							<IconObject getObject={() => { return { ...object, layout: I.ObjectLayout.Human } }} size={56} tooltip="Your profile" onClick={this.onProfile} />
						</div>
					</div>
					
					<div id="documents" className={Util.toCamelCase('tab-' + tab.id)}> 
						<div id="tabWrap" className="tabWrap">
							<div className="tabs">
								{tabs.map((item: any, i: number) => (
									<TabItem key={i} {...item} />
								))}
							</div>
							<div className="btns">
								<div id="searchWrap" className="btn searchWrap" onClick={this.onSearch}>
									<Icon className="search" />
									<Filter 
										ref={(ref: any) => { this.refFilter = ref; }} 
										placeholder="" 
										placeholderFocus="" 
										value={filter}
										onChange={this.onFilterChange}
									/>
								</div>
								{(tab.id == Tab.Recent) && list.length ? <div className="btn" onClick={this.onClear}>Clear</div> : ''}
							</div>
						</div>
						<div id="selectWrap" className="tabWrap">
							<div className="tabs">
								<div id="selectCnt" className="side left"></div>
								<div className="side right">
									<div className="element" onClick={this.onSelectionDelete}>
										<Icon className="delete" />
										<div className="name">Delete</div>
									</div>
									<div className="element" onClick={this.onSelectionRestore}>
										<Icon className="restore" />
										<div className="name">Restore</div>
									</div>
									<div id="selectAll" className="element" onClick={this.onSelectionAll}>
										<Icon className="all" />
										<div className="name">Select all</div>
									</div>
									<div id="selectNone" className="element" onClick={this.onSelectionNone}>
										<Icon className="all" />
										<div className="name">Deselect all</div>
									</div>
									<div className="element" onClick={this.onSelectionClose}>
										<Icon className="close" tooltip="Close" />
									</div>
								</div>
							</div>
						</div>
						{content}
					</div>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const win = $(window);
		const tabs = this.getTabs();

		crumbs.delete(I.CrumbsType.Page);

		this.onTab(Storage.get('tabIndex') || tabs[0].id);
		this.onScroll();
		this.selectionRender();

		win.unbind('scroll.page').on('scroll.page', (e: any) => { this.onScroll(); });
	};
	
	componentDidUpdate () {
		this.resize();

		if (this.id) {
			const node = $(ReactDOM.findDOMNode(this));
			const item = node.find(`#item-${this.id}`);

			item.addClass('hover');
		};

		this.selectionRender();
	};

	componentWillUnmount () {
		$(window).unbind('scroll.page');
		menuStore.closeAll(Constant.menuIds.index);
	};

	onScroll () {
		const win = $(window);
		const top = win.scrollTop();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const list = node.find('#documents');
		const selectWrap = node.find('#selectWrap');
		const header = node.find('#header');
		const hh = Util.sizeHeader();

		if (!list.length) {
			return;
		};

		const oy = list.offset().top;
		const menu = $('#menuSelect.add');
		const offsetTitle = 256;

		let yt = 0;
		if (oy - top <= offsetTitle) {
			yt = oy - top - offsetTitle;
		};

		if (list.hasClass('isSelecting')) {
			if (oy - top <= hh) {
				header.addClass('selectFixed');
				list.addClass('selectFixed');
				selectWrap.css({ top: hh });
			} else {
				header.removeClass('selectFixed');
				list.removeClass('selectFixed');
				selectWrap.css({ top: '' });
			};
		};

		title.css({ transform: `translate3d(0px,${yt}px,0px)` });
		menu.css({ transform: `translate3d(0px,${yt}px,0px)`, transition: 'none' });
	};

	getTabs () {
		const { config } = commonStore;

		let tabs: any[] = [
			{ id: Tab.Favorite, name: 'Favorites' },
			{ id: Tab.Recent, name: 'History' },
			{ id: Tab.Set, name: 'Sets', load: true },
		];

		if (config.sudo) {
			tabs.push({ id: Tab.Space, name: 'Spaces', load: true });
			tabs.push({ id: Tab.Shared, name: 'Shared', load: true });
		};

		tabs.push({ id: Tab.Archive, name: 'Bin', load: true });
		return tabs;
	};

	onTab (id: Tab) {
		let tabs = this.getTabs();
		let tab = tabs.find((it: any) => { return it.id == id; });
		if (!tab) {
			tab = tabs[0];
			id = tab.id;
		};

		this.state.tab = id;	
		this.setState({ tab: id, pages: [] });

		Storage.set('tabIndex', id);
		analytics.event('TabHome', { tab: tab.name });

		if (tab.load) {
			this.load();
		};
	};

	load () {
		const { tab, filter } = this.state;
		const { config } = commonStore;

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: tab == Tab.Archive },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc }
		];

		if (tab == Tab.Set) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set });
		};

		if (tab == Tab.Space) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.space });
		};

		if (tab == Tab.Shared) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: Constant.typeId.space });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.NotEmpty, value: null });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHighlighted', condition: I.FilterCondition.Equal, value: true });
		};

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false });
		};

		this.setState({ loading: true });

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, 0, 100, (message: any) => {
			if (message.error.code) {
				return;
			};

			this.setState({ loading: false, pages: message.records });
		});
	};

	onSearch (e: any) {
		e.stopPropagation();

		const node = $(ReactDOM.findDOMNode(this));
		const searchWrap = node.find('#searchWrap');
		const page = $('.page');

		if (searchWrap.hasClass('active')) {
			return;
		};

		searchWrap.addClass('active');
		this.refFilter.focus();

		window.setTimeout(() => {
			page.unbind('click').on('click', (e: any) => {
				if ($.contains(searchWrap.get(0), e.target)) {
					return;
				};

				searchWrap.removeClass('active');
				page.unbind('click');

				window.setTimeout(() => { this.setFilter(''); }, 210);
			});
		}, 210);
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => { this.setFilter(v); }, 500);
	};

	setFilter (v: string) {
		if (this.refFilter) {
			this.refFilter.setValue(v);
		};
		this.setState({ filter: v });
		this.load();
	};

	onAccount () {
		menuStore.open('account', {
			element: '#button-account',
			horizontal: I.MenuDirection.Right
		});
	};
	
	onProfile (e: any) {
		const { profile } = blockStore;
		const object = detailStore.get(profile, profile, []);

		DataUtil.objectOpenEvent(e, object);
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();
		e.persist();

		const { tab } = this.state;
		const object = item.isBlock ? item._object_ : item;

		if (tab == Tab.Archive) {
			this.onSelect(e, item);
		} else {
			crumbs.cut(I.CrumbsType.Page, 0, () => {
				DataUtil.objectOpenEvent(e, object);
			});
		};
	};

	getObject (item: any) {
		return item.isBlock ? item._object_ : item;
	};

	onSelect (e: any, item: any) {
		e.stopPropagation();
		e.persist();

		let object = this.getObject(item);
		let idx = this.selected.indexOf(object.id);
		if (idx >= 0) {
			this.selected.splice(idx, 1);
		} else {
			this.selected.push(object.id);
		};

		this.selected = Util.arrayUnique(this.selected);
		this.selectionRender();
		this.onScroll();
	};

	selectionRender () {
		const node = $(ReactDOM.findDOMNode(this));
		const wrapper = node.find('#documents');
		const cnt = node.find('#selectCnt');
		const selectAll = node.find('#selectAll');
		const selectNone = node.find('#selectNone');
		const items = this.getList();
		const l = this.selected.length;

		if (l == items.length) {
			selectAll.hide();
			selectNone.show();
		} else {
			selectAll.show();
			selectNone.hide();
		};

		l ? wrapper.addClass('isSelecting') : wrapper.removeClass('isSelecting');
		cnt.text(`Selected ${l} ${Util.cntWord(l, 'object', 'objects')}`);

		node.find('.item.isSelected').removeClass('isSelected');
		this.selected.forEach((id: string) => {
			node.find(`#item-${id}`).addClass('isSelected');
		});
	};

	onSelectionDelete (e: any) {
		const l = this.selected.length;

		popupStore.open('confirm', {
			data: {
				title: `Are you sure you want to delete ${l} ${Util.cntWord(l, 'object', 'objects')}?`,
				text: 'These objects will be deleted irrevocably. You can’t undo this action.',
				textConfirm: 'Delete',
				onConfirm: () => {
					C.ObjectListDelete(this.selected, () => {
						this.selected = [];
						this.selectionRender();
			
						this.load();
					});
				}
			},
		});
	};
	
	onSelectionRestore (e: any) {
		C.ObjectListSetIsArchived(this.selected, false, () => {
			this.selected = [];
			this.selectionRender();
			
			this.load();
		});
	};

	onSelectionAll (e: any) {
		const items = this.getList();

		this.selected = [];

		items.forEach((it: any) => {
			let object = this.getObject(it);
			this.selected.push(object.id);
		});

		this.selectionRender();
	};

	onSelectionNone (e: any) {
		this.selected = [];
		this.selectionRender();
	};

	onSelectionClose (e: any) {
		this.selected = [];
		this.selectionRender();
	};

	onStore (e: any) {
		DataUtil.objectOpenPopup({ layout: I.ObjectLayout.Store }, {
			onClose: () => { this.load(); }
		});
	};
	
	onAdd (e: any) {
		DataUtil.pageCreate('', '', { isDraft: true }, I.BlockPosition.Bottom, '', {}, (message: any) => {
			this.load();

			DataUtil.objectOpenPopup({ id: message.targetId }, {
				onClose: () => { this.load(); }
			});
		});
	};

	onMore (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { tab } = this.state;
		const { root, recent, profile } = blockStore;
		const object = item.isBlock ? item._object_ : item;
		const rootId = tab == Tab.Recent ? recent : root;
		const subIds = [ 'searchObject' ];
		const favorites = blockStore.getChildren(blockStore.root, blockStore.root, (it: I.Block) => {
			return it.isLink() && (it.content.targetBlockId == object.id);
		});

		let menuContext = null;
		let archive = null;
		let link = null;
		let remove = null;
		let move = { id: 'move', icon: 'move', name: 'Move to', arrow: true };
		let types = dbStore.getObjectTypesForSBType(I.SmartBlockType.Page).map((it: I.ObjectType) => { return it.id; });
		
		if (favorites.length) {
			link = { id: 'unfav', icon: 'unfav', name: 'Remove from Favorites' };
		} else {
			link = { id: 'fav', icon: 'fav', name: 'Add to Favorites' };
		};

		if (object.isArchived) {
			link = null;
			remove = { id: 'remove', icon: 'remove', name: 'Delete' };
			archive = { id: 'unarchive', icon: 'undo', name: 'Restore from bin' };
		} else {
			archive = { id: 'archive', icon: 'remove', name: 'Move to bin' };
		};

		if (object.isReadonly || object.templateIsBundled || (object.id == profile) || ([ Constant.typeId.relation ].indexOf(object.type) >= 0)) {
			archive = null;
		};

		if ([ Tab.Favorite ].indexOf(tab) < 0) {
			move = null;
		};

		const options = [
			archive,
			remove,
			move,
			link,
		];

		const onArchive = (v: boolean) => {
			const cb = (message: any) => {
				if (message.error.code) {
					return;
				};

				if (object.type == Constant.typeId.type) {
					dbStore.objectTypeUpdate({ id: object.id, isArchived: v });
				};

				this.load();
			};

			C.ObjectSetIsArchived(object.id, v, cb);
		};

		menuStore.open('select', { 
			element: `#button-${item.id}-more`,
			offsetY: 8,
			horizontal: I.MenuDirection.Center,
			subIds: subIds,
			onOpen: (context: any) => {
				menuContext = context;
			},
			data: {
				options: options,
				onOver: (e: any, el: any) => {
					menuStore.closeAll(subIds, () => {
						if (el.id == 'move') {
							const filters = [
								{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: types }
							];

							menuStore.open('searchObject', {
								element: `#menuSelect #item-${el.id}`,
								offsetX: menuContext.getSize().width,
								vertical: I.MenuDirection.Center,
								isSub: true,
								data: {
									rebind: menuContext.ref.rebind,
									rootId: rootId,
									blockId: item.id,
									blockIds: [ item.id ],
									type: I.NavigationType.Move, 
									skipIds: [ rootId ],
									filters: filters,
									position: I.BlockPosition.Bottom,
									onSelect: (el: any) => { menuContext.close(); }
								}
							});
						};
					});
				},
				onSelect: (e: any, el: any) => {
					if (el.arrow) {
						menuStore.closeAll(subIds);
						return;
					};

					switch (el.id) {
						case 'archive':
							onArchive(true);
							break;

						case 'unarchive':
							onArchive(false);
							break;

						case 'fav':
							C.ObjectSetIsFavorite(object.id, true);
							break;

						case 'unfav':
							C.ObjectSetIsFavorite(object.id, false);
							break;

						case 'remove':
							this.selected = [ object.id ];
							this.onSelectionDelete(e);
							break;
					};
				},
			},
		});
	};

	onSortStart (param: any) {
		const { node } = param;

		this.id = $(node).data('id');
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		if (oldIndex == newIndex) {
			return;
		};
		
		const { root } = blockStore;
		const list = this.getList();
		const current = list[oldIndex];
		const target = list[newIndex];
		const element = blockStore.getMapElement(root, root);
		
		if (!current || !target || !element) {
			return;
		};
		
		const position = newIndex < oldIndex ? I.BlockPosition.Top : I.BlockPosition.Bottom;
		const oidx = element.childrenIds.indexOf(current.id);
		const nidx = element.childrenIds.indexOf(target.id);

		blockStore.updateStructure(root, root, arrayMove(element.childrenIds, oidx, nidx));
		C.BlockListMove(root, root, [ current.id ], target.id, position);
	};
	
	resize () {
		const list = this.getList();
		const size = Constant.size.index;
		const win = $(window);
		const wh = win.height();
		const ww = win.width();
		const node = $(ReactDOM.findDOMNode(this));
		const title = node.find('#title');
		const body = node.find('#body');
		const documents = node.find('#documents');
		const items = node.find('#documents .item');
		const hh = Util.sizeHeader();

		const maxWidth = ww - size.border * 2;
		const cnt = Math.floor(maxWidth / (size.width + size.margin));
		const width = Math.floor((maxWidth - size.margin * (cnt - 1)) / cnt);
		const height = this.getListHeight();

		items.css({ width: width }).removeClass('last');
		title.css({ width: maxWidth });
		body.css({ width: maxWidth });
		documents.css({ marginTop: wh - size.titleY - height - hh });

		items.each((i: number, item: any) => {
			item = $(item);
			const icon = item.find('.iconObject');

			if ((i + 1) >= cnt && ((i + 1) % cnt === 0) && (list.length + 1 > cnt)) {
				item.addClass('last');
			};
			if (icon.length) {
				item.addClass('withIcon');
			};
		});

		this.onScroll();
	};

	getListHeight () {
		const size = Constant.size.index;
		return (size.height + size.margin) * 2 + size.margin * 2;
	};

	getList () {
		const { root, recent } = blockStore;
		const { config } = commonStore;
		const { tab, filter, pages } = this.state;
		
		let reg = null;
		let list: any[] = [];
		let rootId = root;
		let recentIds = [];

		if (filter) {
			reg = new RegExp(Util.filterFix(filter), 'gi');
		};

		switch (tab) {
			default:
			case Tab.Favorite:
			case Tab.Recent:
				if (tab == Tab.Recent) {
					rootId = recent;
					recentIds = crumbs.get(I.CrumbsType.Recent).ids;
				};

				list = blockStore.getChildren(rootId, rootId, (it: any) => {
					if (!it.content.targetBlockId) {
						return false;
					};

					const object = detailStore.get(rootId, it.content.targetBlockId, []);
					const { name, isArchived } = object;

					if (reg && name && !name.match(reg)) {
						return false;
					};
					return !isArchived;
				}).map((it: any) => {
					if (tab == Tab.Recent) {
						it._order = recentIds.findIndex((id: string) => { return id == it.content.targetBlockId; });
					};

					it._object_ = detailStore.get(rootId, it.content.targetBlockId, [ 'templateIsBundled' ]);
					it.isBlock = true;
					return it;
				});

				if (tab == Tab.Recent) {
					list.sort((c1: any, c2: any) => {
						if (c1._order > c2._order) return -1;
						if (c2._order < c1._order) return 1;
						return 0;
					});
				};

				break;

			case Tab.Archive:
			case Tab.Set:
			case Tab.Space:
			case Tab.Shared:
				list = pages;
				break;
		};

		return list;
	};

	onClear () {
		const recent = crumbs.get(I.CrumbsType.Recent);
		recent.ids = [];
		crumbs.save(I.CrumbsType.Recent, recent);
	};

});

export default PageMainIndex;