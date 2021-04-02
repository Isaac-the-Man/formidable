<template>
    <div class="row">
        <div class="col">
            <h1>Registration</h1>
            <b-card v-if="isAvailable && event" class="shadow">
                <b-card-body>
                    <b-card-title>{{ event.title }}</b-card-title>
                    <b-card-text>
                        {{ event.desc }}
                    </b-card-text>
                    <b-form @submit="createRecord">
                        <div v-for="(field, i) in event.fields" :key="i">
                            <AppFormInput
                                    v-model="form.fields[field.index]"
                                    :title="field.title"
                                    :type="field.type"
                                    :required="field.status !== 'optional'"
                                    :options="field.options"></AppFormInput>
                        </div>
                        <b-form-group label="Timeslots">
                            <b-form-select :options="timeslots" v-model="form.timeslot" required></b-form-select>
                        </b-form-group>
                        <b-button variant="primary" type="submit">Submit</b-button>
                    </b-form>
                </b-card-body>
            </b-card>
            <h3 v-else class="lead">
                Event Unavailable.
                <b-link to="/events">Return.</b-link>
            </h3>
        </div>
    </div>
</template>

<script>
    import AppFormInput from "@/components/form/AppFormInput";
    import moment from 'moment';

    export default {
        name: "Register",
        components: {
            AppFormInput
        },
        data() {
            return {
                event: null,
                form: {
                    fields: [],
                    timeslot: null,
                },
                timeslotCount: null,
                isAvailable: true,
                isLoaded: false
            };
        },
        computed: {
            timeslots() {
                if (!this.event) {
                    return null;
                } else {
                    const formatted = [];
                    this.event.timeslots.forEach((slot, i) => {
                        const seatsLeft = slot.max - this.getTimeslotCount(i);
                        formatted.push({
                            text: this.getTimeslotFormatted(slot, seatsLeft),
                            value: {
                                index: i,
                                datetime: slot.datetime,
                                duration: slot.duration
                            },
                            disabled: seatsLeft <= 0 && slot.max !== -1
                        });
                    });
                    return [
                        {text: 'Select a timeslot', value: null},
                        ...formatted
                    ];
                }
            },
            flattenedForm() {
                const formatted = [];
                for (let value of Object.values(this.event.fields)) {
                    formatted.push({
                        title: value.title,
                        value: this.form.fields[value.index]
                    });
                }
                formatted.push( {
                    title: 'Timeslot',
                    value: `${moment(this.form.timeslot.datetime).format('LLL')}, for ${this.form.timeslot.duration} min`
                })
                return formatted;
            }
        },
        methods: {
            getTimeslotCount(index) {
                if (this.timeslotCount && this.timeslotCount.get(index) !== undefined) {
                    return this.timeslotCount.get(index);
                } else {
                    return 0;
                }
            },
            async updateTimeslotCount() {
                // firebase
                const recordRef = this.$store.state.db.ref('records').child(this.$route.params.id);
                recordRef.on('value', async (data) => {
                    if (data.val()) {
                        const records = data.val();
                        const arr = [];
                        for (let key in records) {
                            arr.push(records[key].timeslot.index);
                        }
                        const map = arr.reduce((acc, e) => acc.set(e, (acc.get(e) || 0) + 1), new Map());
                        this.timeslotCount = map;
                    }
                });
            },
            async pushNewRecord(record) {
                // firebase
                try {
                    // get key ref
                    const newRecordRef = this.$store.state.db.ref('records').child(this.$route.params.id).push();
                    // push to records db
                    await newRecordRef.set(record);
                    this.makeToast('Registration Success !', 'An confirmation mail has been sent to your email address.', 'success');
                    return newRecordRef.key;
                } catch (e) {
                    this.makeToast('Registration Failed !', 'An error occurred during registration. Contact the admins for further supports.', 'danger');
                }
            },
            async createRecord(evt) {
                evt.preventDefault();
                const isConfirm = await this.makeModal('Confirm Registration', 'Incorrect information may lead to the invalidation of your ticket, do you wish to proceed?');
                if (isConfirm) {
                    // add timestamp
                    this.form.createdAt = moment().format();
                    // push form
                    const key = await this.pushNewRecord(this.form);
                    if (key) {
                        // send e-ticket
                        this.axios.post("https://us-central1-pas-portal.cloudfunctions.net/ticketMailer", {
                            dest: this.form.fields[0],
                            event: this.$route.params.id,
                            record: key,
                            eventName: this.event.title,
                            fields: this.flattenedForm
                        });
                        // clear form
                        this.form = {
                            fields: [],
                            timeslot: null
                        }
                        this.setInitialValues();
                    }
                    // redirect to submitted page
                    window.location.href='/events/submitted';
                }
            },
            getTimeslotFormatted(timeslot, seatsLeft) {
                return `${moment(timeslot.datetime).format('LLL')},
                    for ${timeslot.duration} min. (${timeslot.max === -1 ?
                    'unlimited' : seatsLeft} seats left)`
            },
            getInitialValue(type) {
                let value = null;
                switch (type) {
                    case 'String':
                        value = '';
                        break;
                    case 'Email':
                        value = '';
                        break;
                    case 'Number':
                        value = null;
                        break;
                    case 'Boolean':
                        value = false;
                        break;
                    default:
                        value = null;
                        break;
                }
                return value;
            },
            setInitialValues() {
                // update events
                const basicsRef = this.$store.state.db.ref('forms').child(this.$route.params.id);
                basicsRef.on('value', async (data) => {
                    if (!this.isLoaded) {
                        if (data.val().isAvailable) {
                            this.event = data.val();
                            // set initial values
                            for (let i = 0; i < this.event.fields.length; i++) {
                                this.form.fields[this.event.fields[i].index] = this.getInitialValue(this.event.fields[i].type);
                            }
                        } else {
                            this.isAvailable = false;
                        }
                        this.isLoaded = true;
                    } else {
                        // only refresh timeslot after loaded
                        this.event.timeslots = data.val().timeslots;
                    }
                });
            }
        },
        created() {
            this.setInitialValues();
            this.updateTimeslotCount();
        }
    }
</script>

<style scoped>

</style>
