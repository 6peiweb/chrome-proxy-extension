<template>
    <n-form
        :model="model"
        label-placement="left"
        size="small"
        :label-width="100"
        :style="{ maxWidth: '520px' }"
    >
        <n-form-item label="Match" path="match">
            <n-input v-model:value="model.match" />
        </n-form-item>
        <n-form-item label="FilterType" path="filterType">
            <n-select
                v-model:value="model.filterType"
                :options="selectOptions"
            />
        </n-form-item>
        <n-form-item label="HttpStatus" path="httpStatus">
            <n-input-number
                v-model:value="model.httpStatus"
                @blur="httpStatusChange"
            />
        </n-form-item>
        <n-form-item label="Response" path="responseText">
            <n-input
                type="textarea"
                :autosize="{minRows:4}"
                v-model:value="model.responseText"
            />
        </n-form-item>
    </n-form>
</template>

<script>
import { defineComponent, ref, watch } from "vue";

const selectOptions = [
    {
        label: "Include",
        value: "normal",
    },
    {
        label: "Regexp",
        value: "regexp",
    },
];

export default defineComponent({
    props: ["item"],
    emits: ["update"],
    setup(props, context) {
        const model = ref(props.item);
        const httpStatusChange = () => {
            const value = model.value.httpStatus;
            if (value < 200) {
                model.value = {
                    ...model.value,
                    httpStatus: 200,
                };
            } else if (value >= 600) {
                model.value = {
                    ...model.value,
                    httpStatus: 500,
                };
            }
        };

        watch(
            model,
            (value) => context.emit('update', value),
            { deep: true }
        );
        return {
            model,
            selectOptions,
            httpStatusChange,
        };
    },
});
</script>