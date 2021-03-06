<template>
    <div class="container bg-white py-3 border border-top-0">
        <div class="row">
            <div class="col">
                <h3>View Response</h3>
                <AppFormSelector v-model="formSelected"></AppFormSelector>
                <hr>
            </div>
        </div>
        <div v-if="form" class="row">
            <div class="col">
                <h3>{{ form.title }}</h3>
                <p>{{ form.desc }}</p>
            </div>
        </div>
        <div v-if="records" class="row">
            <div class="col-sm">
                <b-form-group
                        label="Filter" label-for="filterInput">
                    <b-form-input id="filterInput" type="search" placeholder="Type to filter"
                                  v-model="filterKeyword"></b-form-input>
                </b-form-group>
            </div>
            <div class="col-sm">
                <b-form-group
                        label="Filter by" label-for="filterByInput">
                    <b-form-select id="filterByInput" v-model="filterBy" :options="sortFields" value-field="key"
                                   text-field="label"></b-form-select>
                </b-form-group>
            </div>
        </div>
        <div v-if="records" class="row">
            <div class="col-sm">
                <b-form-group
                        label="Filter time" label-for="filterTimeInput">
                    <b-form-select id="filterTimeInput" v-model="filterTime" :options="timeOptions"></b-form-select>
                </b-form-group>
            </div>
            <div class="col-sm">
                <b-form-group
                        label="Per page" label-for="perPageInput">
                    <b-form-select id="perPageInput" :options="pageOptions" v-model="perPage"></b-form-select>
                </b-form-group>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <div v-if="form">
                    <!-- show records -->
                    <b-table :fields="fields"
                             show-empty
                             striped
                             hover
                             head-variant="dark"
                             :items="options"
                             :bordered="true"
                             :responsive="true"
                             :current-page="currentPage"
                             :per-page="perPage"
                             :filter="filterKeyword"
                             :filter-included-fields="filterBy"
                             @filtered="onFiltered">
                        <template v-slot:cell(timeslot)="row">
                            {{ getDuration(row.value.datetime, row.item.duration) + ' (' + row.value.duration + ' min)' }}
                        </template>
                        <template v-slot:cell(createdAt)="row">
                            {{ row.value | moment('LLL') }}
                        </template>
                        <template v-slot:cell(isCheckedIn)="row">
                            {{ row.value? row.value : 'unchecked' | moment('LLL') }}
                        </template>
                        <template v-slot:cell(actions)="row">
                            <b-button size="sm" @click="removeRecord(row.item.key)">Remove</b-button>
                        </template>
                    </b-table>
                </div>
                <h3 v-else class="text-center font-italic font-weight-light">
                    Select a Form to Start...
                </h3>
            </div>
        </div>
        <div v-if="records" class="row">
            <div class="col text-center">
                <b-pagination
                        v-model="currentPage"
                        :total-rows="totalRows"
                        :per-page="perPage"
                        align="center">
                </b-pagination>
                <i>{{ Object.values(records).length }} people have signed up for the event</i>
                <br>
                <b-button class="mt-3" variant="primary">
                    <AppJsonCSV :labels="dlLabels" :data="dlOptions" name="records.csv"
                                :fields="dlFields"
                    >Download CSV
                    </AppJsonCSV>
                </b-button>
            </div>
        </div>
    </div>
</template>

<script>
    import AppFormSelector from "@/components/form/AppFormSelector";
    import JsonCSV from 'vue-json-csv';
    import moment from 'moment';

    export default {
        name: "TheViewRegister",
        components: {
            AppFormSelector,
            AppJsonCSV: JsonCSV
        },
        data() {
            return {
                form: null,
                formSelected: null,
                records: null,
                currentPage: 1,
                totalRows: 1,
                perPage: 5,
                pageOptions: [5, 10, 20, 30, 40, 50],
                filterKeyword: '',
                filterBy: null,
                filterTime: null
            };
        },
        methods: {
            getDuration(start, dur) {
                const startMoment = moment(start);
                const endMoment = startMoment.clone().add(dur, 'm');
                if (startMoment.isSame(endMoment, 'day')) {
                    return startMoment.format('LLL') + ' ~ ' + endMoment.format('h:mm A');
                } else {
                    return startMoment.format('LLL') + ' ~ ' + endMoment.format('LLL');
                }
            },
            onFiltered(filteredItems) {
                // Trigger pagination to update the number of buttons/pages due to filtering
                this.totalRows = filteredItems.length
                this.currentPage = 1
            },
            async removeRecord(key) {
                try {
                    const confirm = await this.makeModal('Remove Record', 'Are you sure you want to remove the selected record? This process will be irreversible.');
                    if (confirm) {
                        const recRef = this.$store.state.db.ref('/records').child(this.formSelected).child(key);
                        await recRef.remove();
                        this.makeToast('Record Removed!', 'Successfully removed record.', 'success');
                    }
                } catch (e) {
                    this.makeToast('Failed to Remove Record!', 'An error occurred while removing record. Contact the admins for further support.', 'danger');
                }
            }
        },
        computed: {
            dlOptions() {
                // flatten option for download
                const formatted = [];
                for (let item of this.options) {
                    formatted.push({...item});
                }
                for (let item of formatted) {
                    item.createdAt = moment(item.createdAt).format();
                    item.$datetime = moment(item.timeslot.datetime).format();
                    item.$duration = item.timeslot.duration
                    item.timeslot = undefined;
                    item.isCheckedIn = item.isCheckedIn ? moment(item.isCheckedIn).format() : 'false';
                }
                return formatted;
            },
            dlLabels() {
                const formatted = {};
                for (let item of this.fields) {
                    if (item.key !== 'actions') {
                        if (item.key === 'timeslot') {
                            formatted['$datetime'] = 'Registered Time';
                            formatted['$duration'] = 'Registered Duration';
                        } else {
                            formatted[item.key] = item.label;
                        }
                    }
                }
                return formatted;
            },
            dlFields() {
                const formatted = [];
                for (let item of this.fields) {
                    if (item.key !== 'actions') {
                        if (item.key === 'timeslot') {
                            formatted.push('$datetime');
                            formatted.push('$duration');
                        } else {
                            formatted.push(item.key);
                        }
                    }
                }
                return formatted;
            },
            options() {
                // flatten records for table use
                if (this.records) {
                    const formatted = [];
                    for (let [key, value] of Object.entries(this.records)) {
                        // filter timeslot
                        if (this.filterTime) {
                            if (value.timeslot.datetime !== this.filterTime.datetime || value.timeslot.duration !== this.filterTime.duration) {
                                continue;
                            }
                        }
                        // flatten fields
                        let newField = {
                            createdAt: value.createdAt,
                            timeslot: value.timeslot,
                            isCheckedIn: value.isCheckedIn,
                            key
                        };
                        for (let [i, value] of value.fields.entries()) {
                            newField[`$field${i}`] = value;
                        }
                        formatted.push(newField);
                    }
                    return formatted;
                } else {
                    return [];
                }
            },
            timeOptions() {
                const formatted = [
                    {text: 'Select a timeslot', value: null}
                ];
                for (let {datetime, duration} of this.form.timeslots) {
                    formatted.push({
                        text: this.getDuration(datetime, duration) + ' (' + duration + ' min)',
                        value: {
                            datetime,
                            duration
                        }
                    });
                }
                return formatted
            },
            fields() {
                if (this.form) {
                    // custom fields
                    const extracted = [];
                    for (let [i, field] of this.form.fields.entries()) {
                        extracted.push({
                            key: `$field${i}`,
                            label: field.title,
                            sortable: true
                        });
                    }
                    // basic info
                    extracted.push({
                            key: 'timeslot',
                            label: 'Time',
                            sortable: true
                        }, {
                            key: 'createdAt',
                            label: 'Submit Time',
                            sortable: true
                        }, {
                            key: 'isCheckedIn',
                            label: 'Checked In',
                            sortable: true
                        },
                        {
                            key: 'actions',
                            label: 'Actions'
                        });
                    return extracted;
                } else {
                    return [];
                }
            },
            sortFields() {
                // custom fields
                const extracted = [];
                for (let [i, field] of this.form.fields.entries()) {
                    extracted.push({
                        key: `$field${i}`,
                        label: field.title,
                        sortable: true
                    });
                }
                return [
                    {label: 'Select a field', key: null},
                    ...extracted
                ];
            }
        },
        watch: {
            async formSelected() {
                if (this.formSelected) {
                    // fetch form data
                    const formRef = this.$store.state.db.ref('forms');
                    formRef.child(this.formSelected).once('value', (data) => {
                        this.form = data.val();
                        this.makeToast('Form Loaded !', 'You can now view the selected form.', 'info');
                    });
                    // listen to records
                    const recRef = this.$store.state.db.ref('records');
                    recRef.child(this.formSelected).on('value', (data) => {
                        this.records = data.val();
                        this.totalRows = this.options.length;
                    });
                } else {
                    this.form = null;
                }
            },
            filterBy() {
                this.filterKeyword = '';
            },
            filterTime() {
                this.onFiltered(this.options);
            }
        }
    }
</script>

<style scoped>

</style>