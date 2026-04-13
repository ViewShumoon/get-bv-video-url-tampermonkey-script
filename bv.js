// ==UserScript==
// @name         Bilibili BV视频直链生成器
// @namespace    http://tampermonkey.net/
// @version      V0.2-2026-04-13
// @description  在B站视频页添加按钮，一键生成视频直链地址并复制
// @author       You
// @match        https://www.bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_xmlhttpRequest
// ==/UserScript==


(function() {
    'use strict';

    // 配置类
    class GetDirectLinkConfig {
        constructor(name, generator) {
            this.name = name;
            this.generator = generator;
        }

        async generateLink(bv) {
            return await this.generator(bv);
        }
    }

    // 配置列表
    const ConfigList = {
        // 配置1：bv.rwit.net - 直接替换链接
        BV_RWIT_NET: new GetDirectLinkConfig("bv.rwit.net", async (bv) => {
            return `https://bv.rwit.net/${bv}`;
        }),

        // 配置2：biliapi.imoe.xyz - 调用API接口
        BILIAPI_IMOE_XYZ: new GetDirectLinkConfig("biliapi.imoe.xyz", async (bv) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://biliapi.imoe.xyz/api/v1/bilibili/video/${bv}/mp4`,
                    onload: function(response) {
                        if (response.status >= 200 && response.status < 300) {
                            resolve(response.finalUrl);
                        } else {
                            reject(new Error(`请求失败: ${response.status}`));
                        }
                    },
                    onerror: function(error) {
                        reject(new Error('网络请求失败'));
                    }
                });
            });
        })
    };

    // 等待页面元素加载
    function waitForElement(selector, callback, preTimeout = 0) {
        const element = document.querySelector(selector);
        if (element) {
            setTimeout(() => callback(element), preTimeout);
        } else {
            setTimeout(() => waitForElement(selector, callback), 500);
        }
    }

    // 创建按钮
    function createButton() {
        waitForElement(PARENT_ELEMENT, (parent) => {
            // 检查按钮是否已存在，避免重复创建
            if (document.getElementById(COPY_BUTTON_ID)) return;

            const button = document.createElement('button');
            button.id = COPY_BUTTON_ID;
            button.style.cssText = `
                padding: 6px 12px;
                background: #40C5F1;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            `;
            button.textContent = '复制直链';

            button.onclick = async function() {
                // 1. 获取当前URL
                const currentUrl = window.location.href;

                // 2. 使用正则提取 BV号
                const bvMatch = currentUrl.match(/(BV\w+)/);

                if (bvMatch && bvMatch[1]) {
                    const bv = bvMatch[1];
                    try {
                        // 3. 生成直链
                        const newLink = await CURRENT_CONFIG.generateLink(bv);

                        navigator.clipboard.writeText(newLink).then(() => {
                            button.textContent = '已复制！';
                            setTimeout(() => {
                                button.textContent = '复制直链';
                            }, 1500);
                        }).catch(err => {
                            console.error('复制失败:', err);
                            button.textContent = '复制失败';
                        });
                    } catch (err) {
                        console.error('生成链接失败:', err);
                        button.textContent = '生成链接失败';
                    }
                } else {
                    button.textContent = '未匹配到BV号';
                }
            };

            parent.appendChild(button);
        }, 2000);
    }

    // 当前使用的配置（修改此处切换配置）
    const CURRENT_CONFIG = ConfigList.BILIAPI_IMOE_XYZ;

    // 父元素
    const PARENT_ELEMENT = ".video-info-meta";

    // 复制按钮Id
    const COPY_BUTTON_ID = "copy-bv-link-btn";

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }
})();
