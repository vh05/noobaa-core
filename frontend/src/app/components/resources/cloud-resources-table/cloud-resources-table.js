import template from './cloud-resources-table.html';
import ko from 'knockout';
import CloudResourceRowViewModel from './cloud-resource-row';
import { systemInfo } from 'model';
import { makeArray } from 'utils';


const maxRows = 100;

class CloudResourcesTableViewModel {
    constructor() {
        let resources = ko.pureComputed(
            () => {
                if (!systemInfo()) {
                    return;
                }

                return systemInfo().pools.filter(
                    ({ cloud_info }) => cloud_info
                );
            }
        );

        let rows = makeArray(
            maxRows,
            i => new CloudResourceRowViewModel(() => resources() && resources()[i])
        );

        this.visibleRows = ko.pureComputed(
            () => rows.filter(row => row.isVisible())
        );

        this.deleteGroup = ko.observable();

        this.isAddCloudResourceModalVisible = ko.observable(false);
    }

    showAddCloudResourceModal() {
        this.isAddCloudResourceModalVisible(true);
    }

    hideCloudReousrceModal() {
        this.isAddCloudResourceModalVisible(false);
    }
}

export default {
    viewModel: CloudResourcesTableViewModel,
    template: template
};
