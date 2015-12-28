// Register the components with knockout component container.
export default function register(ko) {

	// -------------------------------
	// Empty component
	// -------------------------------
	ko.components.register('empty', { template: ' ' });

	// -------------------------------
	// Layout
	// -------------------------------
	ko.components.register('main-layout', 	require('./layout/main-layout/main-layout'));	
	ko.components.register('header', 		require('./layout/header/header'));
	ko.components.register('commands-bar', 	require('./layout/commands-bar/commands-bar'));
	ko.components.register('breadcrumbs', 	require('./layout/breadcrumbs/breadcrumbs'));
	
	// -------------------------------
	// Login
	// -------------------------------
	ko.components.register('login-layout', 			require('./login/login-layout/login-layout'));		
	ko.components.register('signin-form', 			require('./login/signin-form/signin-form'));	
	ko.components.register('create-system-form', 	require('./login/create-system-form/create-system-form'));	

	// -------------------------------
	// Overview
	// -------------------------------
	ko.components.register('overview-panel', 		require('./overview/overview-panel/overview-panel'));
	ko.components.register('pools-overview', 		require('./overview/pools-overview/pools-overview'));
	ko.components.register('buckets-overview',		require('./overview/buckets-overview/buckets-overview'));	
	ko.components.register('install-node-wizard',	require('./overview/install-node-wizard/install-node-wizard'));
	ko.components.register('connect-app-wizard',	require('./overview/connect-app-wizard/connect-app-wizard'));

	// -------------------------------
	// Buckets
	// -------------------------------
	ko.components.register('buckets-panel', 		require('./buckets/buckets-panel/buckets-panel'));
	ko.components.register('buckets-table', 		require('./buckets/buckets-table/buckets-table'));
	ko.components.register('create-bucket-wizard',	require('./buckets/create-bucket-wizard/create-bucket-wizard'));

	// -------------------------------
	// Bucket
	// -------------------------------
	ko.components.register('bucket-panel', 			require('./bucket/bucket-panel/bucket-panel'));
	ko.components.register('bucket-summary', 		require('./bucket/bucket-summary/bucket-summary'));
	ko.components.register('bucket-objects-tab',	require('./bucket/bucket-objects-tab/bucket-objects-tab'));
	ko.components.register('bucket-objects-table',	require('./bucket/bucket-objects-table/bucket-objects-table'));
	ko.components.register('bucket-policy-modal',	require('./bucket/bucket-policy-modal/bucket-policy-modal'));
	ko.components.register('upload-files-modal',	require('./bucket/upload-files-modal/upload-files-modal'));

	// -------------------------------
	// Object
	// -------------------------------
	ko.components.register('object-panel', 		require('./object/object-panel/object-panel'));
	ko.components.register('object-summary', 	require('./object/object-summary/object-summary'));
	ko.components.register('object-parts-table',require('./object/object-parts-table/object-parts-table'));	

	// -------------------------------
	// Pools
	// -------------------------------
	ko.components.register('pools-panel', 			require('./pools/pools-panel/pools-panel'));
	ko.components.register('pools-table', 			require('./pools/pools-table/pools-table'));
	ko.components.register('create-pool-wizard', 	require('./pools/create-pool-wizard/create-pool-wizard'));

	// -------------------------------
	// Pool
	// -------------------------------
	ko.components.register('pool-panel', 	require('./pool/pool-panel/pool-panel'));
	ko.components.register('pool-summary', 	require('./pool/pool-summary/pool-summary'));

	// -------------------------------
	// Node
	// -------------------------------
	ko.components.register('node-panel', 		require('./node/node-panel/node-panel'));
	ko.components.register('node-summary', 		require('./node/node-summary/node-summary'));
	ko.components.register('node-parts-table', 	require('./node/node-parts-table/node-parts-table'));
	ko.components.register('node-info', 		require('./node/node-info/node-info'));

	// -------------------------------
	// shared
	// -------------------------------
	ko.components.register('svg-icon', 			require('./shared/svg-icon/svg-icon'));
	ko.components.register('modal', 			require('./shared/modal/modal'));
	ko.components.register('dropdown', 			require('./shared/dropdown/dropdown'));
	ko.components.register('radio-btn', 		require('./shared/radio-btn/radio-btn'));
	ko.components.register('checkbox', 			require('./shared/checkbox/checkbox'));
	ko.components.register('capacity-gauge',	require('./shared/capacity-gauge/capacity-gauge'));	
	ko.components.register('range-indicator', 	require('./shared/range-indicator/range-indicator'));	
	ko.components.register('action-list', 		require('./shared/action-list/action-list'));
	ko.components.register('stepper', 			require('./shared/stepper/stepper'));
	ko.components.register('multiselect',		require('./shared/multiselect/multiselect'));
	ko.components.register('slider',			require('./shared/slider/slider'));
	ko.components.register('wizard',			require('./shared/wizard/wizard'));
}