<template>
    <div class="header">
        <div class="title">Proxy</div>
        <div
            v-if="activeConfig.name"
            class="menu-icon"
            :style="`
                    margin-left: 20px;
                    background:${activeConfig.bgColor || '#50a14f'};
                    color:${activeConfig.textColor || '#ffffff'};
                `"
        >
            {{ (activeConfig.name || "")[0] }}
        </div>
        <div style="color: #ffffff; margin-left: 8px">
            {{ activeConfig.name }}
        </div>
        <div class="operate">
            <n-dropdown
                trigger="click"
                @select="selectHandler"
                :options="operateOptions"
            >
                <div class="add">
                    <img
                        wdith="24"
                        height="24"
                        alt=""
                        src="../../assets/add.svg"
                    />
                </div>
            </n-dropdown>
            <div class="stop" @click="stopStatusHandler">
                <img
                    v-if="stopStatus"
                    alt=""
                    wdith="24"
                    height="24"
                    src="../../assets/stop.svg"
                />
                <img
                    v-else
                    alt=""
                    wdith="24"
                    height="24"
                    src="../../assets/continue.svg"
                />
            </div>
        </div>
    </div>
    <n-layout-sider
        bordered
        show-trigger
        :width="240"
        collapse-mode="width"
        :collapsed-width="35"
        :collapsed="collapsed"
        @collapse="collapsed = true"
        @expand="collapsed = false"
    >
        <n-button class="add-config" @click="showModal = true">
            <n-icon size="40" color="#50a14f">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M368.5 240H272v-96.5c0-8.8-7.2-16-16-16s-16 7.2-16 16V240h-96.5c-8.8 0-16 7.2-16 16 0 4.4 1.8 8.4 4.7 11.3 2.9 2.9 6.9 4.7 11.3 4.7H240v96.5c0 4.4 1.8 8.4 4.7 11.3 2.9 2.9 6.9 4.7 11.3 4.7 8.8 0 16-7.2 16-16V272h96.5c8.8 0 16-7.2 16-16s-7.2-16-16-16z"
                    />
                </svg>
            </n-icon>
        </n-button>
        <n-menu
            id="n-menu"
            :collapsed-width="35"
            :collapsed="collapsed"
            :options="menuOptions"
            :collapsed-icon-size="25"
            @update:value="onMenuUpdate"
            v-model:value="activeConfig.key"
        />
        <n-switch
            v-if="proxyList.length"
            class="collapse-switch"
            :value="switchValue"
            @update:value="switchValueChange"
        />
        <div class="n-sider-content" id="n-sider-content">
            <n-collapse
                arrow-placement="left"
                :expanded-names="expandedProxyList"
                @update:expanded-names="updateExpandedNames"
            >
                <n-collapse-item
                    :key="index"
                    :name="index"
                    v-for="(item, index) in proxyList"
                >
                    <template #header>
                        <div class="collapse-item-content">
                            <span>{{ collapseTitle(item, index) }}</span>
                            <n-checkbox
                                class="n-checkbox-margin"
                                v-model:checked="item.checked"
                                @click="stopPropagation($event)"
                                @update:checked="usedChange($event, index)"
                            ></n-checkbox>
                            <div
                                class="delete-icon"
                                @click="deleteConfig($event, index)"
                            ></div>
                        </div>
                    </template>
                    <Form
                        :item="item"
                        @update="collapseItemUpdate($event, index)"
                    />
                </n-collapse-item>
            </n-collapse>
        </div>
    </n-layout-sider>
    <n-modal v-model:show="showModal">
        <n-card class="n-card" :bordered="true" size="huge">
            <n-input
                type="input"
                v-model:value="inputValue"
                placeholder="Config Name"
            />
            <n-button
                style="margin-top: 12px"
                type="primary"
                round
                @click="addConfig"
                >Submit</n-button
            >
        </n-card>
    </n-modal>
</template>

<script>
import { h, ref, computed, onMounted } from "vue";

import {
    CURRENT_PROXY_CONFIG,
    CONFIG_LIST,
    PROXY_STATUS,
} from "../../utils/enum";

const bgJs = chrome.extension.getBackgroundPage();

const renderIcon = (config) => {
    const bgColor = config.bgColor || "#50a14f";
    const textColor = config.textColor || "#ffffff";

    return () =>
        h(
            "div",
            {
                class: "menu-icon",
                style: `
                    color: ${textColor};
                    background: ${bgColor};
                `,
            },
            [config.text]
        );
};

const OperateType = {
    RequestData: 1,
    ResponseData: 2,
    RequestHeader: 3,
    ResponseHeader: 4,
};
const operateOptions = [
    {
        label: "ResponseData",
        key: OperateType.ResponseData,
    },
];
const initConfig = {
    match: ".*.com",
    filterType: "regexp",
    checked: true,
    expanded: true,
    httpStatus: 200,
    responseText: "{}",
};

export default {
    data() {
        return {
            collapsed: true,
            operateOptions,
        };
    },
    setup() {
        const stopStatus = ref(true);
        const stopStatusHandler = async () => {
            stopStatus.value = !stopStatus.value;
            await bgJs.setStorageMap(PROXY_STATUS, stopStatus.value);
            await bgJs.sendMessage();
        };

        const activeConfig = ref({});
        const inputValue = ref("");
        const showModal = ref(false);
        const getRandom = () => Math.random().toString(16).slice(2);
        const menuOptions = ref([]);
        const deleteLabel = async (index) => {
            const newMenuOptions = [...menuOptions.value].reverse();
            const config = newMenuOptions.splice(index, 1)[0];
            await bgJs.setStorages({
                [CONFIG_LIST]: newMenuOptions,
            });
            await initTabs();
            if (config.key === activeConfig.value.key) {
                const theCurConfig = menuOptions.value[0] || {};
                await bgJs.setStorages({
                    [CURRENT_PROXY_CONFIG]: theCurConfig,
                });
                activeConfig.value = theCurConfig;
            }
            await bgJs.sendMessage();
        };
        const initTabs = async () => {
            const configList = await bgJs.getStorage(CONFIG_LIST);
            menuOptions.value = (configList || [])
                .map((item, index) => {
                    return {
                        ...item,
                        icon: renderIcon({
                            text: item.name[0] || index,
                        }),
                        label: () => {
                            return h("div", { class: "menu-label-title" }, [
                                item.name,
                                h("div", {
                                    class: "menu-label-delete",
                                    onClick: deleteLabel.bind(null, index),
                                }),
                            ]);
                        },
                    };
                })
                .reverse();
        };
        const addConfig = async () => {
            const key = getRandom();
            const currentConfig = {
                name: inputValue.value,
                key,
                value: JSON.stringify([initConfig]),
            };

            await bgJs.setStorageList(CONFIG_LIST, currentConfig);
            await initTabs();

            inputValue.value = "";
            showModal.value = false;
            activeConfig.value = currentConfig;

            await bgJs.setStorageMap(CURRENT_PROXY_CONFIG, currentConfig);
            await bgJs.sendMessage();
            const menuEle = document.getElementById("n-menu");
            if (menuEle) {
                menuEle.scrollTo(0, 0);
            }
        };

        const onMenuUpdate = async (_, item) => {
            activeConfig.value = item;
            await bgJs.setStorageMap(CURRENT_PROXY_CONFIG, item);
        };

        const proxyList = computed(() => {
            try {
                return JSON.parse(activeConfig.value.value);
            } catch {
                return [];
            }
        });

        const expandedProxyList = computed(() => {
            try {
                return proxyList.value
                    .map((item, index) => {
                        return item.expanded ? index : null;
                    })
                    .filter((v) => v !== null);
            } catch {
                return undefined;
            }
        });
        const updateData = async (result) => {
            await bgJs.setStorageList(CONFIG_LIST, result);
            await bgJs.setStorageMap(CURRENT_PROXY_CONFIG, result);
            await initTabs();
            activeConfig.value = result;
        };
        const updateExpandedNames = async (activeList) => {
            const newProxyList = proxyList.value.map((item, index) => {
                return {
                    ...item,
                    expanded: activeList.includes(index),
                };
            });
            const result = {
                ...activeConfig.value,
                value: JSON.stringify(newProxyList),
            };
            await updateData(result);
        };

        const switchValue = computed(() => {
            if (!expandedProxyList.value.length) {
                return false;
            }
            return expandedProxyList.value.length === proxyList.value.length;
        });
        const switchValueChange = (newVal) => {
            const activeList = newVal
                ? proxyList.value.map((_, index) => index)
                : [];
            updateExpandedNames(activeList);
        };
        const collapseTitle = (item, index) => {
            const type = item.filterType === "normal" ? "Include" : "Regexp";
            return `${index + 1}. ${type} - ${item.match}`;
        };
        const collapseItemUpdate = async (value, index) => {
            const newProxyList = proxyList.value.map((item, ind) => {
                return index === ind ? value : item;
            });
            const result = {
                ...activeConfig.value,
                value: JSON.stringify(newProxyList),
            };
            await updateData(result);
            await bgJs.sendMessage();
        };
        const selectHandler = async (type) => {
            switch (type) {
                case OperateType.ResponseData:
                    const newProxyList = [...proxyList.value, initConfig];
                    const result = {
                        ...activeConfig.value,
                        value: JSON.stringify(newProxyList),
                    };
                    await updateData(result);
                    await bgJs.sendMessage();

                    setTimeout(() => {
                        const siderContentEle =
                            document.getElementById("n-sider-content");
                        const scrollHeight = siderContentEle.scrollHeight;
                        siderContentEle.scrollTo(0, scrollHeight);
                    }, 500);
                    return;
                default:
                    return;
            }
        };
        const usedChange = async (value, index) => {
            const newProxyList = proxyList.value.map((item, ind) => {
                return index === ind
                    ? {
                          ...item,
                          checked: value,
                      }
                    : item;
            });
            const result = {
                ...activeConfig.value,
                value: JSON.stringify(newProxyList),
            };
            await updateData(result);
        };

        const stopPropagation = (e) => {
            e.stopPropagation();
        };

        const deleteConfig = async (e, index) => {
            stopPropagation(e);
            const newProxyList = proxyList.value.filter(
                (_, ind) => index !== ind
            );
            const result = {
                ...activeConfig.value,
                value: JSON.stringify(newProxyList),
            };
            await updateData(result);
            await bgJs.sendMessage();
        };

        onMounted(async () => {
            const proxyStatus = await bgJs.getStorage(PROXY_STATUS);
            stopStatus.value = proxyStatus;

            const config = await bgJs.getStorage(CURRENT_PROXY_CONFIG);
            activeConfig.value = config || {};
            await initTabs();
        });

        return {
            menuOptions,
            selectHandler,
            stopStatus,
            stopStatusHandler,
            addConfig,
            activeConfig,
            showModal,
            inputValue,
            onMenuUpdate,
            proxyList,
            expandedProxyList,
            updateExpandedNames,
            switchValue,
            switchValueChange,
            collapseTitle,
            collapseItemUpdate,
            usedChange,
            stopPropagation,
            deleteConfig,
        };
    },
};
</script>

<style lang="scss">
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    width: 600px;
    border: 1px solid rgba(80, 161, 79, 0.8);
}

.delete-icon {
    width: 16px;
    height: 16px;
    background-image: url("../../assets/delete.svg");
    background-size: 100% 100%;
    cursor: pointer;
    position: absolute;
    right: 20px;
    &:hover {
        background-image: url("../../assets/delete-active.svg");
    }
}

.header {
    background: #50a14f;
    height: 48px;
    display: flex;
    align-items: center;
    position: relative;
    .title {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: 700;
        width: 60px;
        height: 36px;
        border: 1px solid #fff;
        border-radius: 5px;
        margin-left: 12px;
        cursor: pointer;
    }
    .operate {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        right: 12px;
    }
}

.menu-label-title {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.menu-label-delete {
    width: 16px;
    height: 16px;
    background-image: url("../../assets/delete.svg");
    background-size: 100% 100%;
    cursor: pointer;
    position: absolute;
    right: 8px;
    &:hover {
        background-image: url("../../assets/delete-active.svg");
    }
}

.n-checkbox-margin {
    margin: 0px 10px;
}

.n-layout-sider-scroll-container {
    background: #ffffff;
}

.stop,
.add {
    height: 40px;
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    &:hover {
        background: rgba(200, 200, 200, 0.3);
    }
    &:active {
        background: rgba(200, 200, 200, 0.5);
    }
}

.n-layout-sider {
    position: relative !important;
}

.collapse-switch {
    position: absolute;
    top: 5px;
    left: 60px;
    cursor: pointer;
}

.n-switch__rail {
    z-index: -1;
    cursor: pointer;
}

.n-sider-content {
    position: absolute;
    top: 0;
    left: 60px;
    padding: 40px 0 16px;
    height: calc(100% - 56px);
    width: calc(600px - 60px);
    text-align: left;
    overflow-y: scroll;
    z-index: -1;
}

.collapse-item-content {
    display: flex;
    align-items: center;
}

.menu-icon {
    width: 24px;
    height: 24px;

    font-size: 14px;
    font-weight: 700;
    border-radius: 50%;
    border: 1px solid #f5f5f5;

    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(0, 0, 0, 0.1) inset;
    }
}

.n-card {
    width: 200px !important;
    .n-card__content {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
    }
}

.add-config {
    cursor: pointer;
    transform: translateY(5px);
    width: calc(100% - 10px) !important;
    border-radius: 5px !important;
}

.n-menu-item-content {
    padding: 5px !important;
}

.n-menu-item {
    height: auto !important;
    &.n-menu-item--selected {
        .menu-icon {
            box-shadow: 0 1px 4px #50a14f, 0 0 20px #50a14f inset;
        }
    }
}

.n-menu {
    min-height: 327px !important;
    max-height: 327px !important;
    overflow-y: scroll !important;
    &::-webkit-scrollbar {
        width: 0;
    }
}

.n-input-number {
    width: 100% !important;
}
</style>
