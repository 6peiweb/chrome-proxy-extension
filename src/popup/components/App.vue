<template>
    <img alt="Vue logo" src="../../assets/logo.png" />
    {{ count }}
    <n-button @click="inc">naive-ui</n-button>
</template>

<script>
import { ref } from "vue";

export default {
    setup() {
        const count = ref(0);
        const inc = () => {
            count.value ++;
        }

        return {
            count,
            inc,
        }
    }
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
}
</style>
