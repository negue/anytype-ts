import * as React from 'react';
import { Icon } from 'Component';
import { I, keyboard, DataUtil, ObjectUtil } from 'Lib';
import { observer } from 'mobx-react';

const HeaderMainStore = observer(class HeaderMainStore extends React.Component<I.HeaderComponent> {

	constructor (props: I.HeaderComponent) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
	};

	render () {
		const { tabs, tab, onTab, onHome, onForward, onBack } = this.props;
		
		return (
			<React.Fragment>
				<div className="side left">
					<Icon className="expand big" tooltip="Open as object" onClick={this.onOpen} />
					<Icon className="home big" tooltip="Home" onClick={onHome} />
					<Icon className={[ 'back', 'big', (!keyboard.checkBack() ? 'disabled' : '') ].join(' ')} tooltip="Back" onClick={onBack} />
					<Icon className={[ 'forward', 'big', (!keyboard.checkForward() ? 'disabled' : '') ].join(' ')} tooltip="Forward" onClick={onForward} />
				</div>

				<div className="side center">
					<div id="tabs" className="tabs">
						{tabs.map((item: any) => (
							<div key={item.id} className={[ 'tab', (item.id == tab ? 'active' : '') ].join(' ')} onClick={() => { onTab(item.id); }}>
								{item.name}
							</div>
						))}
					</div>
				</div>

				<div className="side right" />
			</React.Fragment>
		);
	};

	componentDidMount(): void {
		if (!this.props.isPopup) {
			DataUtil.setWindowTitleText('Library');
		};
	};

	onOpen () {
		ObjectUtil.openRoute({ layout: I.ObjectLayout.Navigation });
	};

});

export default HeaderMainStore;