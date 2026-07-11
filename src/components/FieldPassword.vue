<script setup lang="ts">
import { FormField } from '@primevue/forms';
import { useI18n } from 'vue-i18n';
import { translateError } from '../composables/translateError';

/**@see https://primevue.dev/password/ */
const { t } = useI18n();

const props = defineProps<{
    name: string;
    label: string;
    description?: string;
    toggleMask?: boolean;
    feedback?: boolean;
    modelValue?: string;
    placeholder?: string;
}>();
const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();
</script>

<template>
    <FormField :name="name" :initialValue="modelValue" v-slot="{ value, error, props: fieldProps }">
      
        <div class="flex flex-col w-full gap-1">
            <label class="font-semibold! text-lg!">{{ label }}</label>

            <div class="flex gap-2 align-items-center w-full">
                <Password
                    v-bind="{ ...fieldProps, onInput: undefined }"
                    :modelValue="props.modelValue !== undefined ? props.modelValue : value"
                    @update:modelValue="
                        (val: string) => {
                            fieldProps.onChange?.(val);
                            emit('update:modelValue', val);
                        }
                    "
                    :toggleMask="true"
                    :feedback="feedback ?? false"
                    :invalid="!!error"
                    :placeholder="placeholder ?? ''"
                    :promptLabel="t('common.password.prompt')"
                    :weakLabel="t('common.password.weak')"
                    :mediumLabel="t('common.password.medium')"
                    :strongLabel="t('common.password.strong')"
                    class="w-full"
                    inputClass="w-full"
                />
                <slot name="actions" />
            </div>

            <small v-if="error" class="text-red-500 text-sm">
                {{ translateError(error.message) }}
            </small>
        </div>
    </FormField>
</template>