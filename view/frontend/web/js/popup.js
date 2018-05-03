/**
 * Mageplaza
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Mageplaza.com license that is
 * available through the world-wide-web at this URL:
 * https://www.mageplaza.com/LICENSE.txt
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade this extension to newer
 * version in the future.
 *
 * @category    Mageplaza
 * @package     Mageplaza_SocialLogin
 * @copyright   Copyright (c) 2018 Mageplaza (http://www.mageplaza.com/)
 * @license     https://www.mageplaza.com/LICENSE.txt
 */

define([
    'jquery',
    'Magento_Customer/js/customer-data',
    'mage/translate',
    'mageplaza/core/jquery/popup'
], function ($, customerData, $t) {
    'use strict';

    $.widget('mageplaza.socialpopup', {
        options: {
            /*General*/
            popup: '#social-login-popup',
            popupEffect: '',
            headerLink: '.header .links, .section-item-content .header.links',
            ajaxLoading: '#social-login-popup .ajax-loading',
            loadingClass: 'social-login-ajax-loading',
            errorMsgClass: 'message-error error message',
            successMsgClass: 'message-success success message',
            /*Login*/
            loginFormContainer: '.social-login.authentication',
            loginFormContent: '.social-login.authentication .social-login-customer-authentication .block-content',
            loginForm: '#social-form-login',
            loginBtn: '#bnt-social-login-authentication',
            forgotBtn: '#social-form-login .action.remind',
            createBtn: '#social-form-login .action.create',
            formLoginUrl: '',
            /*Email*/
            emailFormContainer: '.social-login.fake-email',
            fakeEmailSendBtn: '#social-form-fake-email .action.send',
            fakeEmailType: '',
            fakeEmailFrom: '#social-form-fake-email',
            fakeEmailFormContent: '.social-login.fake-email .block-content',
            fakeEmailUrl: '',
            fakeEmailCancelBtn: '#social-form-fake-email .action.cancel',
            /*Forgot*/
            forgotFormContainer: '.social-login.forgot',
            forgotFormContent: '.social-login.forgot .block-content',
            forgotForm: '#social-form-password-forget',
            forgotSendBtn: '#social-form-password-forget .action.send',
            forgotBackBtn: '#social-form-password-forget .action.back',
            forgotFormUrl: '',
            /*Create*/
            createFormContainer: '.social-login.create',
            createFormContent: '.social-login.create .block-content',
            createForm: '#social-form-create',
            createAccBtn: '#social-form-create .action.create',
            createBackBtn: '#social-form-create .action.back',
            createFormUrl: '',
            /*Captcha*/
            loginCaptchaImg: '.authentication .captcha-img',
            createCaptchaImg: '.create .captcha-img',
            forgotCaptchaImg: '.forgot .captcha-img'
        },

        /**
         * @private
         */
        _create: function () {
            var self = this;
            this.initObject();
            this.initLink();
            this.initObserve();
            window.fakeEmailCallback = function (type) {
                self.options.fakeEmailType = type;
                self.showEmail();
            };
        },

        /**
         * Init object will be used
         */
        initObject: function () {
            this.loginForm = $(this.options.loginForm);
            this.createForm = $(this.options.createForm);
            this.forgotForm = $(this.options.forgotForm);

            this.forgotFormContainer = $(this.options.forgotFormContainer);
            this.createFormContainer = $(this.options.createFormContainer);
            this.loginFormContainer = $(this.options.loginFormContainer);

            this.loginFormContent = $(this.options.loginFormContent);
            this.forgotFormContent = $(this.options.forgotFormContent);
            this.createFormContent = $(this.options.createFormContent);

            this.loginCaptchaImg = $(this.options.loginCaptchaImg);
            this.createCaptchaImg = $(this.options.createCaptchaImg);
            this.forgotCaptchaImg = $(this.options.forgotCaptchaImg);

            this.emailFormContainer = $(this.options.emailFormContainer);
            this.fakeEmailFrom = $(this.options.fakeEmailFrom);
            this.fakeEmailFormContent = $(this.options.fakeEmailFormContent);
        },

        /**
         * Init links login
         */
        initLink: function () {
            var self = this,
                headerLink = $(this.options.headerLink);

            if (headerLink.length) {
                headerLink.find('a').each(function (link) {
                    var el = $(this),
                        href = el.attr('href');

                    if (typeof href !== 'undefined' && (href.search('customer/account/login') !== -1 || href.search('customer/account/create') !== -1)) {
                        el.addClass('social-login');
                        el.attr('href', self.options.popup);
                        el.attr('data-effect', self.options.popupEffect);
                        el.on('click', function (event) {
                            if (href.search('customer/account/create') !== -1) {
                                self.showCreate();
                            } else {
                                self.showLogin();
                            }

                            event.preventDefault();
                        });
                    }
                });

                headerLink.magnificPopup({
                    delegate: 'a.social-login',
                    removalDelay: 500,
                    callbacks: {
                        beforeOpen: function () {
                            this.st.mainClass = this.st.el.attr('data-effect');
                        }
                    },
                    midClick: true
                });
            }

            this.options.createFormUrl = this.correctUrlProtocol(this.options.createFormUrl);
            this.options.formLoginUrl = this.correctUrlProtocol(this.options.formLoginUrl);
            this.options.forgotFormUrl = this.correctUrlProtocol(this.options.forgotFormUrl);
            this.options.fakeEmailUrl = this.correctUrlProtocol(this.options.fakeEmailUrl);
        },

        /**
         * Correct url protocol to match with current protocol
         * @param url
         * @returns {*}
         */
        correctUrlProtocol: function (url) {
            var protocol = window.location.protocol;
            if (!url.includes(protocol)) {
                url = url.replace(/http:|https:/gi, protocol);
            }

            return url;
        },

        /**
         * Init button click
         */
        initObserve: function () {
            this.initLoginObserve();
            this.initCreateObserve();
            this.initForgotObserve();
            this.initEmailObserve();

            $(this.options.createBtn).on('click', this.showCreate.bind(this));
            $(this.options.forgotBtn).on('click', this.showForgot.bind(this));
            $(this.options.createBackBtn).on('click', this.showLogin.bind(this));
            $(this.options.forgotBackBtn).on('click', this.showLogin.bind(this));
        },

        /**
         * Login process
         */
        initLoginObserve: function () {
            var self = this;

            $(this.options.loginBtn).on('click', this.processLogin.bind(this));
            this.loginForm.find('input').keypress(function (event) {
                var code = event.keyCode || event.which;
                if (code === 13) {
                    self.processLogin();
                }
            });
        },

        /**
         * Create process
         */
        initCreateObserve: function () {
            var self = this;

            $(this.options.createAccBtn).on('click', this.processCreate.bind(this));
            this.createForm.find('input').keypress(function (event) {
                var code = event.keyCode || event.which;
                if (code === 13) {
                    self.processCreate();
                }
            });
        },

        /**
         * Forgot process
         */
        initForgotObserve: function () {
            var self = this;

            $(this.options.forgotSendBtn).on('click', this.processForgot.bind(this));
            this.forgotForm.find('input').keypress(function (event) {
                var code = event.keyCode || event.which;
                if (code === 13) {
                    self.processForgot();
                }
            });
        },

        /**
         * Email process
         */
        initEmailObserve: function () {
            var self = this;

            $(this.options.fakeEmailSendBtn).on('click', this.processEmail.bind(this));
            this.forgotForm.find('input').keypress(function (event) {
                var code = event.keyCode || event.which;
                if (code === 13) {
                    self.processEmail();
                }
            });
        },

        /**
         * Show Login page
         */
        showLogin: function () {
            this.loginFormContainer.show();
            this.forgotFormContainer.hide();
            this.createFormContainer.hide();
            this.emailFormContainer.hide();
        },

        /**
         * Show email page
         */
        showEmail: function () {
            this.loginFormContainer.hide();
            this.forgotFormContainer.hide();
            this.createFormContainer.hide();
            this.emailFormContainer.show();
        },

        /**
         * Show create page
         */
        showCreate: function () {
            this.loginFormContainer.hide();
            this.forgotFormContainer.hide();
            this.createFormContainer.show();
            this.emailFormContainer.hide();
        },

        /**
         * Show forgot password page
         */
        showForgot: function () {
            this.loginFormContainer.hide();
            this.forgotFormContainer.show();
            this.createFormContainer.hide();
            this.emailFormContainer.hide();
        },

        /**
         * Process login
         */
        processLogin: function () {
            if (!this.loginForm.valid()) {
                return;
            }

            var self = this,
                options = this.options,
                loginData = {},
                formDataArray = this.loginForm.serializeArray();

            formDataArray.forEach(function (entry) {
                loginData[entry.name] = entry.value;
                if (entry.name.includes('user_login')) {
                    loginData['captcha_string'] = entry.value;
                    loginData['captcha_form_id'] = 'user_login';
                }
            });

            this.appendLoading(this.loginFormContent);
            this.removeMsg(this.loginFormContent, options.errorMsgClass);

            return $.ajax({
                url: options.formLoginUrl,
                type: 'POST',
                data: JSON.stringify(loginData)
            }).done(function (response) {
                if (response.errors) {
                    self.removeLoading(self.loginFormContent);
                    if (response.imgSrc) {
                        if (self.loginCaptchaImg.length) {
                            self.addMsg(self.loginFormContent, response.message, options.errorMsgClass);
                            self.loginCaptchaImg.attr('src', response.imgSrc);
                        } else {
                            window.location.reload();
                        }
                    } else {
                        var captchaReload = $('#social-form-login .captcha-reload');
                        if (captchaReload.length) {
                            captchaReload.trigger('click');
                        }
                        self.addMsg(self.loginFormContent, response.message, options.errorMsgClass);
                    }
                } else {
                    customerData.invalidate(['customer']);
                    self.addMsg(self.loginFormContent, response.message, options.successMsgClass);
                    if (response.redirectUrl) {
                        window.location.href = response.redirectUrl;
                    } else {
                        location.reload();
                    }
                }
            }).fail(function () {
                self.removeLoading(self.loginFormContent);
                self.addMsg(self.loginFormContent, $t('Could not authenticate. Please try again later'), options.errorMsgClass);
            });
        },

        /**
         * Process forgot
         */
        processForgot: function () {
            if (!this.forgotForm.valid()) {
                return;
            }

            var self = this,
                options = this.options,
                parameters = this.forgotForm.serialize();

            this.appendLoading(this.forgotFormContent);
            this.removeMsg(this.forgotFormContent, options.errorMsgClass);
            this.removeMsg(this.forgotFormContent, options.successMsgClass);

            return $.ajax({
                url: options.forgotFormUrl,
                type: 'POST',
                data: parameters
            }).done(function (response) {
                self.removeLoading(self.forgotFormContent);
                if (response.success) {
                    self.addMsg(self.forgotFormContent, response.message, options.successMsgClass);
                } else {
                    self.addMsg(self.forgotFormContent, response.message, options.errorMsgClass);
                }
                if (response.imgSrc && self.forgotCaptchaImg.length) {
                    self.forgotCaptchaImg.attr('src', response.imgSrc);
                }
            });
        },

        /**
         * Process email
         */
        processEmail: function () {
            if (!this.fakeEmailFrom.valid()) {
                return;
            }
            var input = $("<input>")
                .attr("type", "hidden")
                .attr("name", "type").val(this.options.fakeEmailType.toLowerCase());
            $(this.fakeEmailFrom).append($(input));

            var self = this;
            var options = this.options,
                parameters = this.fakeEmailFrom.serialize();

            this.appendLoading(this.fakeEmailFormContent);
            this.removeMsg(this.fakeEmailFormContent, options.errorMsgClass);
            this.removeMsg(this.fakeEmailFormContent, options.successMsgClass);

            return $.ajax({
                url: options.fakeEmailUrl,
                type: 'POST',
                data: parameters
            }).done(function (response) {
                self.removeLoading(self.fakeEmailFormContent);
                if (response.success) {
                    self.addMsg(self.fakeEmailFrom, response.message, options.successMsgClass);
                    if (response.url == '' || response.url == null) {
                        window.location.reload(true);
                    } else {
                        window.location.href = response.url;
                    }
                } else {
                    self.addMsg(self.fakeEmailFrom, response.message, options.errorMsgClass);
                }
            });
        },

        /**
         * Process create account
         */
        processCreate: function () {
            if (!this.createForm.valid()) {
                return;
            }

            var self = this,
                options = this.options,
                parameters = this.createForm.serialize();

            this.appendLoading(this.createFormContent);
            this.removeMsg(this.createFormContent, options.errorMsgClass);

            return $.ajax({
                url: options.createFormUrl,
                type: 'POST',
                data: parameters
            }).done(function (response) {
                if (response.redirect) {
                    window.location.href = response.redirect;
                } else if (response.success) {
                    customerData.invalidate(['customer']);
                    self.addMsg(self.createFormContent, response.message, options.successMsgClass);
                    window.location.reload(true);
                } else {
                    self.removeLoading(self.createFormContent);
                    if (response.imgSrc) {
                        if (self.createCaptchaImg.length) {
                            self.addMsg(self.createFormContent, response.message, options.errorMsgClass);
                            self.createCaptchaImg.attr('src', response.imgSrc);
                        } else {
                            window.location.reload();
                        }
                    } else {
                        self.addMsg(self.createFormContent, response.message, options.errorMsgClass);
                    }
                }
            });
        },

        /**
         * @param block
         */
        appendLoading: function (block) {
            block.css('position', 'relative');
            block.prepend($("<div></div>", {"class": this.options.loadingClass}))
        },

        /**
         * @param block
         */
        removeLoading: function (block) {
            block.css('position', '');
            block.find("." + this.options.loadingClass).remove();
        },

        /**
         * @param block
         * @param message
         * @param messageClass
         */
        addMsg: function (block, message, messageClass) {
            if (typeof(message) === 'object' && message.length > 0) {
                message.forEach(function (msg) {
                    this._appendMessage(block, msg, messageClass);
                }.bind(this));
            } else if (typeof(message) === 'string') {
                this._appendMessage(block, message, messageClass);
            }
        },

        /**
         * @param block
         * @param messageClass
         */
        removeMsg: function (block, messageClass) {
            block.find('.' + messageClass.replace(/ /g, '.')).remove();
        },

        /**
         * @param block
         * @param message
         * @param messageClass
         * @private
         */
        _appendMessage: function (block, message, messageClass) {
            var currentMessage = null;
            var messageSection = block.find("." + messageClass.replace(/ /g, '.'));
            if (!messageSection.length) {
                block.prepend($('<div></div>', {'class': messageClass}));
                currentMessage = block.children().first();
            } else {
                currentMessage = messageSection.first();
            }

            currentMessage.append($('<div>' + message + '</div>'));
        }
    });

    return $.mageplaza.socialpopup;
});
