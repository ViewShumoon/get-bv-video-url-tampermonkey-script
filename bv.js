// ==UserScript==
// @name         Bilibili BV视频直链生成器
// @namespace    http://tampermonkey.net/
// @version      2026-04-13
// @description  在B站视频页添加按钮，一键生成并复制BV号的直链地址 (https://bv.rwit.net/BVxxxx)
// @author       You
// @match        https://www.bilibili.com/video/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    // 目标域名
    const TARGET_DOMAIN = "https://bv.rwit.net/";

    // 父元素
    const PARENT_ELEMENT = ".video-info-meta";

    // 复制按钮Id
    const COPY_BUTTON_ID = "copy-bv-link-btn";

    // 等待页面元素加载
    function waitForElement(selector, callback, preTimeout = 0) {
        const element = document.querySelector(selector);
        if (element) {
            setTimeout(() => callback(element), preTimeout);
        } else {
            setTimeout(() => waitForElement(selector, callback), 500); // 稍后重试
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

            button.onclick = function() {
                // 1. 获取当前URL
                const currentUrl = window.location.href;

                // 2. 使用正则提取 BV号
                const bvMatch = currentUrl.match(/(BV\w+)/);

                if (bvMatch && bvMatch[1]) {
                    // 3. 拼接新链接
                    const newLink = TARGET_DOMAIN + bvMatch[1];

                    // 4. 复制到剪贴板
                    navigator.clipboard.writeText(newLink).then(() => {
                        // 简单的视觉反馈
                        button.textContent = '已复制!';
                        setTimeout(() => {
                            button.textContent = '复制直链';
                        }, 1500);
                    }).catch(err => {
                        console.error('复制失败:', err);
                        alert('复制失败，请手动复制');
                    });
                } else {
                    alert('未找到BV号');
                }
            };

            parent.appendChild(button);
        }, 2000);
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createButton);
    } else {
        createButton();
    }
})();