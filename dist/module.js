System.register(["lodash", "app/plugins/sdk"], function (exports_1, context_1) {
    "use strict";
    var __extends = (this && this.__extends) || (function () {
        var extendStatics = function (d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
    })();
    var lodash_1, sdk_1, PLUGIN_ID, CONFIG, BoomCommentsCtl, getTooltipMessage, sortAndSliceComments, getPanelStyle, appendLeadingZeroes;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            }
        ],
        execute: function () {
            PLUGIN_ID = "yesoreyeram-boomcomments-panel";
            CONFIG = {
                comment_postbox_positions: [
                    { text: "Top", value: "top" },
                    { text: "Bottom", value: "bottom" },
                ],
                comment_tag: "boom-comment",
                comments_order: [
                    { text: "New Comments at Top", value: "new_comments_at_top" },
                    { text: "New Comments at Bottom", value: "new_comments_at_bottom" },
                ],
                cssThemes: {
                    dark: "plugins/" + PLUGIN_ID + "/css/default.dark.css",
                    light: "plugins/" + PLUGIN_ID + "/css/default.light.css"
                },
                default_templateURL: "partials/module.html",
                editorTabs: [
                    {
                        position: 2,
                        templatePath: "public/plugins/" + PLUGIN_ID + "/partials/options.html",
                        title: "Panel Options"
                    }
                ],
                grafana_events: {
                    dataReceived: "data-received",
                    initEditMode: "init-edit-mode",
                    panelTeardown: "panel-teardown",
                    refresh: "refresh",
                    render: "render"
                }
            };
            sdk_1.loadPluginCss(CONFIG.cssThemes);
            BoomCommentsCtl = (function (_super) {
                __extends(BoomCommentsCtl, _super);
                function BoomCommentsCtl($scope, $injector, $http, backendSrv) {
                    var _this = _super.call(this, $scope, $injector) || this;
                    _this.raw_comments = [];
                    _this.comments = [];
                    _this.activeEditorTabIndex = -2;
                    _this.comment_postbox_positions = CONFIG.comment_postbox_positions;
                    _this.comments_order = CONFIG.comments_order;
                    _this.panelDefaults = {
                        comment_postbox_position: "bottom",
                        comment_tag: CONFIG.comment_tag,
                        comments_order: "new_comments_at_top",
                        enable_inline_commentbox: false,
                        highlight_newComments: true,
                        highlight_newComments_color: "yellow",
                        highlight_newComments_minutes: 3,
                        number_of_comments_to_show: 5,
                        refresh_frequency: 10
                    };
                    lodash_1.default.defaultsDeep(_this.panel, _this.panelDefaults);
                    _this.$http = $http;
                    _this.backendSrv = backendSrv;
                    _this.events.on(CONFIG.grafana_events.initEditMode, _this.onInitEditMode.bind(_this));
                    _this.events.on(CONFIG.grafana_events.panelTeardown, _this.onPanelTeardown.bind(_this));
                    _this.events.on(CONFIG.grafana_events.refresh, _this.refreshComments.bind(_this));
                    _this.events.on(CONFIG.grafana_events.render, _this.refreshComments.bind(_this));
                    _this.refreshComments();
                    return _this;
                }
                BoomCommentsCtl.prototype.onPanelTeardown = function () {
                    this.$timeout.cancel(this.nextTickPromise);
                };
                BoomCommentsCtl.prototype.onInitEditMode = function () {
                    var _this = this;
                    lodash_1.default.each(CONFIG.editorTabs, function (editorTab) {
                        _this.addEditorTab(editorTab.title, editorTab.templatePath, editorTab.position);
                    });
                };
                BoomCommentsCtl.prototype.addComment = function (comment_type) {
                    var _this = this;
                    if (this.ctrl.comment_text && this.ctrl.comment_text !== "") {
                        var commentOptions_1 = {
                            "tags": [CONFIG.comment_tag],
                            "text": "" + this.ctrl.comment_text
                        };
                        if (comment_type === "this_dashboard" && this.dashboard.id) {
                            commentOptions_1.dashboardId = this.dashboard.id;
                        }
                        if (this.ctrl.comment_tags && this.ctrl.comment_tags !== "") {
                            lodash_1.default.each(this.ctrl.comment_tags.split(";").map(function (t) { return t.trim(); }), function (tag) {
                                commentOptions_1.tags.push(tag);
                            });
                        }
                        if (this.ctrl.comment_bgColor && this.ctrl.comment_bgColor !== "") {
                            commentOptions_1.tags.push("boom-bgcolor=" + this.ctrl.comment_bgColor);
                        }
                        if (this.ctrl.comment_textColor && this.ctrl.comment_textColor !== "") {
                            commentOptions_1.tags.push("boom-color=" + this.ctrl.comment_textColor);
                        }
                        if (this.ctrl.comment_fontSize && this.ctrl.comment_fontSize !== "") {
                            commentOptions_1.tags.push("boom-fontsize=" + (this.ctrl.comment_fontSize || "100"));
                        }
                        this.backendSrv.post('/api/annotations', commentOptions_1).then(function (response) {
                            console.log("Comment added", response);
                            _this.ctrl.comment_text = "";
                            _this.ctrl.comment_tags = "";
                            _this.ctrl.comment_bgColor = "";
                            _this.ctrl.comment_textColor = "";
                            _this.ctrl.comment_fontSize = "";
                            _this.refreshComments();
                        });
                    }
                };
                BoomCommentsCtl.prototype.refreshComments = function () {
                    var _this = this;
                    this.$timeout.cancel(this.nextTickPromise);
                    var annotations_url = "/api/annotations?";
                    annotations_url += "tags=boom-comment";
                    annotations_url += "&limit=" + (this.panel.number_of_comments_to_show || 10);
                    annotations_url += "" + (this.panel.show_this_dashboard_only === true ? "&dashboardId=" + this.dashboard.id : "");
                    this.backendSrv.get(annotations_url).then(function (annotations) {
                        _this.raw_comments = annotations;
                        _this.render();
                    });
                    this.nextTickPromise = this.$timeout(this.refreshComments.bind(this), this.panel.refresh_frequency * 1000);
                };
                BoomCommentsCtl.prototype.link = function (scope, elem, attrs, ctrl) {
                    this.scope = scope;
                    this.elem = elem;
                    this.attrs = attrs;
                    this.ctrl = ctrl;
                };
                BoomCommentsCtl.templateUrl = CONFIG.default_templateURL;
                return BoomCommentsCtl;
            }(sdk_1.PanelCtrl));
            exports_1("PanelCtrl", BoomCommentsCtl);
            getTooltipMessage = function (annotation) {
                return "\n" + annotation.text + "\n\nMessage by : " + annotation.login + " (" + annotation.email + ")\nCreated at : " + new Date(annotation.created) + "\nUpdated at : " + new Date(annotation.updated) + "\nTags : " + annotation.tags.join(", ") + "\n  ";
            };
            sortAndSliceComments = function (raw_comments, sort_order, elementsToReturn) {
                var sorted_comments = lodash_1.default.sortBy(raw_comments, [function (o) { return o.time; }]);
                if (sort_order === "new_comments_at_top") {
                    sorted_comments = lodash_1.default.sortBy(sorted_comments, [function (o) { return -1 * o.time; }]);
                }
                else if (sort_order === "new_comments_at_bottom") {
                    sorted_comments = lodash_1.default.sortBy(sorted_comments, [function (o) { return o.time; }]);
                }
                return lodash_1.default.take(sorted_comments, elementsToReturn);
            };
            getPanelStyle = function (highlight_newComments_color) {
                return "\n    @keyframes blinkbg {\n        50% {\n            background-color: " + (highlight_newComments_color || "white") + ";\n            color: black;\n        }\n    }\n  ";
            };
            appendLeadingZeroes = function (n) {
                if (n <= 9) {
                    return "0" + n;
                }
                return n;
            };
            BoomCommentsCtl.prototype.render = function () {
                var _this = this;
                var panelStyle = getPanelStyle(this.ctrl.panel.highlight_newComments_color);
                var style = document.createElement('style');
                style.type = 'text/css';
                style.appendChild(document.createTextNode(panelStyle));
                this.elem.find("#boom-comments-style").html("");
                this.elem.find("#boom-comments-style").append(style);
                this.comments = [];
                this.raw_comments = sortAndSliceComments(this.raw_comments, this.panel.comments_order, +(this.ctrl.panel.number_of_comments_to_show));
                lodash_1.default.each(this.raw_comments, function (annotation) {
                    var comment = annotation;
                    comment.displayText = "" + annotation.text;
                    comment.displayTitle = getTooltipMessage(annotation);
                    var annotation_created_date = new Date(annotation.created);
                    var formatted_date = annotation_created_date.getFullYear() + "-" + appendLeadingZeroes((annotation_created_date.getMonth() + 1)) + "-" + appendLeadingZeroes(annotation_created_date.getDate()) + " " + appendLeadingZeroes(annotation_created_date.getHours()) + ":" + appendLeadingZeroes(annotation_created_date.getMinutes()) + ":" + appendLeadingZeroes(annotation_created_date.getSeconds());
                    comment.date = formatted_date;
                    var display_comment_classes = [];
                    if (_this.ctrl.panel.highlight_newComments === true && comment.created > ((new Date()).getTime() - (_this.ctrl.panel.highlight_newComments_minutes * 60 * 1000))) {
                        display_comment_classes.push("blink-comment");
                    }
                    comment.displayClass = display_comment_classes.join(" ");
                    comment.inlinestyle = {};
                    lodash_1.default.each(comment.tags, function (tag) {
                        if (tag.trim().toLowerCase().startsWith("boom-bgcolor=") === true) {
                            comment.inlinestyle.background = tag.trim().toLowerCase().replace("boom-bgcolor=", "");
                        }
                        else if (tag.trim().toLowerCase().startsWith("boom-color=") === true) {
                            comment.inlinestyle.color = tag.trim().toLowerCase().replace("boom-color=", "");
                        }
                        else if (tag.trim().toLowerCase().startsWith("boom-fontsize=") === true) {
                            comment.inlinestyle["font-size"] = tag.trim().toLowerCase().replace("boom-fontsize=", "") + "%";
                        }
                    });
                    _this.comments.push(comment);
                });
            };
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFLSSxTQUFTLEdBQUcsZ0NBQWdDLENBQUM7WUFFM0MsTUFBTSxHQUFHO2dCQUNiLHlCQUF5QixFQUFFO29CQUN6QixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7aUJBQ3BDO2dCQUNELFdBQVcsRUFBRSxjQUFjO2dCQUMzQixjQUFjLEVBQUU7b0JBQ2QsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFO29CQUM3RCxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUU7aUJBQ3BFO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxJQUFJLEVBQUUsYUFBVyxTQUFTLDBCQUF1QjtvQkFDakQsS0FBSyxFQUFFLGFBQVcsU0FBUywyQkFBd0I7aUJBQ3BEO2dCQUNELG1CQUFtQixFQUFFLHNCQUFzQjtnQkFDM0MsVUFBVSxFQUFFO29CQUNWO3dCQUNFLFFBQVEsRUFBRSxDQUFDO3dCQUNYLFlBQVksRUFBRSxvQkFBa0IsU0FBUywyQkFBd0I7d0JBQ2pFLEtBQUssRUFBRSxlQUFlO3FCQUN2QjtpQkFDRjtnQkFDRCxjQUFjLEVBQUU7b0JBQ2QsWUFBWSxFQUFFLGVBQWU7b0JBQzdCLFlBQVksRUFBRSxnQkFBZ0I7b0JBQzlCLGFBQWEsRUFBRSxnQkFBZ0I7b0JBQy9CLE9BQU8sRUFBRSxTQUFTO29CQUNsQixNQUFNLEVBQUUsUUFBUTtpQkFDakI7YUFDRixDQUFDO1lBR0YsbUJBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7O2dCQUVGLG1DQUFTO2dCQThCckMseUJBQVks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QUFPLENBQUMsV0FBVyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQzt5QkFDakY7NkJBQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLEtBQUssSUFBSSxFQUFFOzRCQUN6RSxPQUFPLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDO3lCQUNqRztvQkFDSCxDQUFDLENBQUMsQ0FBQztvQkFFSCxLQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLENBQUM7WUFFTCxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy88cmVmZXJlbmNlIHBhdGg9XCIuLi9ub2RlX21vZHVsZXMvZ3JhZmFuYS1zZGstbW9ja3MvYXBwL2hlYWRlcnMvY29tbW9uLmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQgeyBQYW5lbEN0cmwsIGxvYWRQbHVnaW5Dc3MgfSBmcm9tIFwiYXBwL3BsdWdpbnMvc2RrXCI7XHJcblxyXG5sZXQgUExVR0lOX0lEID0gXCJ5ZXNvcmV5ZXJhbS1ib29tY29tbWVudHMtcGFuZWxcIjtcclxuXHJcbmNvbnN0IENPTkZJRyA9IHtcclxuICBjb21tZW50X3Bvc3Rib3hfcG9zaXRpb25zOiBbXHJcbiAgICB7IHRleHQ6IFwiVG9wXCIsIHZhbHVlOiBcInRvcFwiIH0sXHJcbiAgICB7IHRleHQ6IFwiQm90dG9tXCIsIHZhbHVlOiBcImJvdHRvbVwiIH0sXHJcbiAgXSxcclxuICBjb21tZW50X3RhZzogXCJib29tLWNvbW1lbnRcIixcclxuICBjb21tZW50c19vcmRlcjogW1xyXG4gICAgeyB0ZXh0OiBcIk5ldyBDb21tZW50cyBhdCBUb3BcIiwgdmFsdWU6IFwibmV3X2NvbW1lbnRzX2F0X3RvcFwiIH0sXHJcbiAgICB7IHRleHQ6IFwiTmV3IENvbW1lbnRzIGF0IEJvdHRvbVwiLCB2YWx1ZTogXCJuZXdfY29tbWVudHNfYXRfYm90dG9tXCIgfSxcclxuICBdLFxyXG4gIGNzc1RoZW1lczoge1xyXG4gICAgZGFyazogYHBsdWdpbnMvJHtQTFVHSU5fSUR9L2Nzcy9kZWZhdWx0LmRhcmsuY3NzYCxcclxuICAgIGxpZ2h0OiBgcGx1Z2lucy8ke1BMVUdJTl9JRH0vY3NzL2RlZmF1bHQubGlnaHQuY3NzYFxyXG4gIH0sXHJcbiAgZGVmYXVsdF90ZW1wbGF0ZVVSTDogXCJwYXJ0aWFscy9tb2R1bGUuaHRtbFwiLFxyXG4gIGVkaXRvclRhYnM6IFtcclxuICAgIHtcclxuICAgICAgcG9zaXRpb246IDIsXHJcbiAgICAgIHRlbXBsYXRlUGF0aDogYHB1YmxpYy9wbHVnaW5zLyR7UExVR0lOX0lEfS9wYXJ0aWFscy9vcHRpb25zLmh0bWxgLFxyXG4gICAgICB0aXRsZTogXCJQYW5lbCBPcHRpb25zXCJcclxuICAgIH1cclxuICBdLFxyXG4gIGdyYWZhbmFfZXZlbnRzOiB7XHJcbiAgICBkYXRhUmVjZWl2ZWQ6IFwiZGF0YS1yZWNlaXZlZFwiLFxyXG4gICAgaW5pdEVkaXRNb2RlOiBcImluaXQtZWRpdC1tb2RlXCIsXHJcbiAgICBwYW5lbFRlYXJkb3duOiBcInBhbmVsLXRlYXJkb3duXCIsXHJcbiAgICByZWZyZXNoOiBcInJlZnJlc2hcIixcclxuICAgIHJlbmRlcjogXCJyZW5kZXJcIlxyXG4gIH1cclxufTtcclxuXHJcblxyXG5sb2FkUGx1Z2luQ3NzKENPTkZJRy5jc3NUaGVtZXMpO1xyXG5cclxuY2xhc3MgQm9vbUNvbW1lbnRzQ3RsIGV4dGVuZHMgUGFuZWxDdHJsIHtcclxuXHJcbiAgcHVibGljIHN0YXRpYyB0ZW1wbGF0ZVVybCA9IENPTkZJRy5kZWZhdWx0X3RlbXBsYXRlVVJMO1xyXG4gIHB1YmxpYyBzY29wZTogYW55O1xyXG4gIHB1YmxpYyBjdHJsOiBhbnk7XHJcbiAgcHVibGljIGVsZW06IGFueTtcclxuICBwdWJsaWMgYXR0cnM6IGFueTtcclxuICBwdWJsaWMgJGh0dHA6IGFueTtcclxuICBwdWJsaWMgYmFja2VuZFNydjogYW55O1xyXG4gIHB1YmxpYyBuZXh0VGlja1Byb21pc2U6IGFueTtcclxuICBwdWJsaWMgcmF3X2NvbW1lbnRzOiBhbnlbXSA9IFtdO1xyXG4gIHB1YmxpYyBjb21tZW50czogYW55W10gPSBbXTtcclxuICBwdWJsaWMgYWN0aXZlRWRpdG9yVGFiSW5kZXggPSAtMjtcclxuICBwdWJsaWMgY29tbWVudF9wb3N0Ym94X3Bvc2l0aW9ucyA9IENPTkZJRy5jb21tZW50X3Bvc3Rib3hfcG9zaXRpb25zO1xyXG4gIHB1YmxpYyBjb21tZW50c19vcmRlciA9IENPTkZJRy5jb21tZW50c19vcmRlcjtcclxuXHJcbiAgcHVibGljIHBhbmVsRGVmYXVsdHMgPSB7XHJcblxyXG4gICAgY29tbWVudF9wb3N0Ym94X3Bvc2l0aW9uOiBcImJvdHRvbVwiLFxyXG4gICAgY29tbWVudF90YWc6IENPTkZJRy5jb21tZW50X3RhZyxcclxuICAgIGNvbW1lbnRzX29yZGVyOiBcIm5ld19jb21tZW50c19hdF90b3BcIixcclxuICAgIGVuYWJsZV9pbmxpbmVfY29tbWVudGJveDogZmFsc2UsXHJcbiAgICBoaWdobGlnaHRfbmV3Q29tbWVudHM6IHRydWUsXHJcbiAgICBoaWdobGlnaHRfbmV3Q29tbWVudHNfY29sb3I6IFwieWVsbG93XCIsXHJcbiAgICBoaWdobGlnaHRfbmV3Q29tbWVudHNfbWludXRlczogMyxcclxuICAgIG51bWJlcl9vZl9jb21tZW50c190b19zaG93OiA1LFxyXG4gICAgcmVmcmVzaF9mcmVxdWVuY3k6IDEwXHJcblxyXG4gIH07XHJcblxyXG4gIGNvbnN0cnVjdG9yKCRzY29wZSwgJGluamVjdG9yLCAkaHR0cCwgYmFja2VuZFNydikge1xyXG5cclxuICAgIHN1cGVyKCRzY29wZSwgJGluamVjdG9yKTtcclxuICAgIF8uZGVmYXVsdHNEZWVwKHRoaXMucGFuZWwsIHRoaXMucGFuZWxEZWZhdWx0cyk7XHJcblxyXG4gICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgdGhpcy5iYWNrZW5kU3J2ID0gYmFja2VuZFNydjtcclxuXHJcbiAgICB0aGlzLmV2ZW50cy5vbihDT05GSUcuZ3JhZmFuYV9ldmVudHMuaW5pdEVkaXRNb2RlLCB0aGlzLm9uSW5pdEVkaXRNb2RlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5ldmVudHMub24oQ09ORklHLmdyYWZhbmFfZXZlbnRzLnBhbmVsVGVhcmRvd24sIHRoaXMub25QYW5lbFRlYXJkb3duLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5ldmVudHMub24oQ09ORklHLmdyYWZhbmFfZXZlbnRzLnJlZnJlc2gsIHRoaXMucmVmcmVzaENvbW1lbnRzLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5ldmVudHMub24oQ09ORklHLmdyYWZhbmFfZXZlbnRzLnJlbmRlciwgdGhpcy5yZWZyZXNoQ29tbWVudHMuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5yZWZyZXNoQ29tbWVudHMoKTtcclxuXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9uUGFuZWxUZWFyZG93bigpIHtcclxuXHJcbiAgICB0aGlzLiR0aW1lb3V0LmNhbmNlbCh0aGlzLm5leHRUaWNrUHJvbWlzZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvbkluaXRFZGl0TW9kZSgpOiB2b2lkIHtcclxuXHJcbiAgICBfLmVhY2goQ09ORklHLmVkaXRvclRhYnMsIGVkaXRvclRhYiA9PiB7XHJcbiAgICAgIHRoaXMuYWRkRWRpdG9yVGFiKGVkaXRvclRhYi50aXRsZSwgZWRpdG9yVGFiLnRlbXBsYXRlUGF0aCwgZWRpdG9yVGFiLnBvc2l0aW9uKTtcclxuICAgIH0pO1xyXG5cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGRDb21tZW50KGNvbW1lbnRfdHlwZTogc3RyaW5nKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKHRoaXMuY3RybC5jb21tZW50X3RleHQgJiYgdGhpcy5jdHJsLmNvbW1lbnRfdGV4dCAhPT0gXCJcIikge1xyXG5cclxuICAgICAgbGV0IGNvbW1lbnRPcHRpb25zOiBhbnkgPSB7XHJcbiAgICAgICAgXCJ0YWdzXCI6IFtDT05GSUcuY29tbWVudF90YWddLFxyXG4gICAgICAgIFwidGV4dFwiOiBgJHt0aGlzLmN0cmwuY29tbWVudF90ZXh0fWBcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChjb21tZW50X3R5cGUgPT09IFwidGhpc19kYXNoYm9hcmRcIiAmJiB0aGlzLmRhc2hib2FyZC5pZCkge1xyXG4gICAgICAgIGNvbW1lbnRPcHRpb25zLmRhc2hib2FyZElkID0gdGhpcy5kYXNoYm9hcmQuaWQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF90YWdzICYmIHRoaXMuY3RybC5jb21tZW50X3RhZ3MgIT09IFwiXCIpIHtcclxuICAgICAgICBfLmVhY2godGhpcy5jdHJsLmNvbW1lbnRfdGFncy5zcGxpdChcIjtcIikubWFwKHQgPT4gdC50cmltKCkpLCB0YWcgPT4ge1xyXG4gICAgICAgICAgY29tbWVudE9wdGlvbnMudGFncy5wdXNoKHRhZyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF9iZ0NvbG9yICYmIHRoaXMuY3RybC5jb21tZW50X2JnQ29sb3IgIT09IFwiXCIpIHtcclxuICAgICAgICBjb21tZW50T3B0aW9ucy50YWdzLnB1c2goYGJvb20tYmdjb2xvcj0ke3RoaXMuY3RybC5jb21tZW50X2JnQ29sb3J9YCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF90ZXh0Q29sb3IgJiYgdGhpcy5jdHJsLmNvbW1lbnRfdGV4dENvbG9yICE9PSBcIlwiKSB7XHJcbiAgICAgICAgY29tbWVudE9wdGlvbnMudGFncy5wdXNoKGBib29tLWNvbG9yPSR7dGhpcy5jdHJsLmNvbW1lbnRfdGV4dENvbG9yfWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgJiYgdGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgIT09IFwiXCIpIHtcclxuICAgICAgICBjb21tZW50T3B0aW9ucy50YWdzLnB1c2goYGJvb20tZm9udHNpemU9JHt0aGlzLmN0cmwuY29tbWVudF9mb250U2l6ZSB8fCBcIjEwMFwifWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmJhY2tlbmRTcnYucG9zdCgnL2FwaS9hbm5vdGF0aW9ucycsIGNvbW1lbnRPcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkNvbW1lbnQgYWRkZWRcIiwgcmVzcG9uc2UpO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RleHQgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RhZ3MgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X2JnQ29sb3IgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RleHRDb2xvciA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMucmVmcmVzaENvbW1lbnRzKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVmcmVzaENvbW1lbnRzKCk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMuJHRpbWVvdXQuY2FuY2VsKHRoaXMubmV4dFRpY2tQcm9taXNlKTtcclxuXHJcbiAgICBsZXQgYW5ub3RhdGlvbnNfdXJsID0gYC9hcGkvYW5ub3RhdGlvbnM/YFxyXG4gICAgYW5ub3RhdGlvbnNfdXJsICs9IGB0YWdzPWJvb20tY29tbWVudGA7XHJcbiAgICBhbm5vdGF0aW9uc191cmwgKz0gYCZsaW1pdD0ke3RoaXMucGFuZWwubnVtYmVyX29mX2NvbW1lbnRzX3RvX3Nob3cgfHwgMTB9YDtcclxuICAgIGFubm90YXRpb25zX3VybCArPSBgJHt0aGlzLnBhbmVsLnNob3dfdGhpc19kYXNoYm9hcmRfb25seSA9PT0gdHJ1ZSA/IFwiJmRhc2hib2FyZElkPVwiICsgdGhpcy5kYXNoYm9hcmQuaWQgOiBcIlwifWA7XHJcblxyXG4gICAgdGhpcy5iYWNrZW5kU3J2LmdldChhbm5vdGF0aW9uc191cmwpLnRoZW4oYW5ub3RhdGlvbnMgPT4ge1xyXG4gICAgICB0aGlzLnJhd19jb21tZW50cyA9IGFubm90YXRpb25zO1xyXG4gICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5uZXh0VGlja1Byb21pc2UgPSB0aGlzLiR0aW1lb3V0KHRoaXMucmVmcmVzaENvbW1lbnRzLmJpbmQodGhpcyksIHRoaXMucGFuZWwucmVmcmVzaF9mcmVxdWVuY3kgKiAxMDAwKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBsaW5rKHNjb3BlOiBhbnksIGVsZW06IGFueSwgYXR0cnM6IGFueSwgY3RybDogYW55KTogdm9pZCB7XHJcblxyXG4gICAgdGhpcy5zY29wZSA9IHNjb3BlO1xyXG4gICAgdGhpcy5lbGVtID0gZWxlbTtcclxuICAgIHRoaXMuYXR0cnMgPSBhdHRycztcclxuXHJcbiAgICB0aGlzLmN0cmwgPSBjdHJsO1xyXG4gIH1cclxuXHJcbn1cclxuXHJcbmxldCBnZXRUb29sdGlwTWVzc2FnZSA9IGZ1bmN0aW9uIChhbm5vdGF0aW9uOiBhbnkpOiBzdHJpbmcge1xyXG5cclxuICByZXR1cm4gYFxyXG4ke2Fubm90YXRpb24udGV4dH1cclxuXHJcbk1lc3NhZ2UgYnkgOiAke2Fubm90YXRpb24ubG9naW59ICgke2Fubm90YXRpb24uZW1haWx9KVxyXG5DcmVhdGVkIGF0IDogJHsgbmV3IERhdGUoYW5ub3RhdGlvbi5jcmVhdGVkKX1cclxuVXBkYXRlZCBhdCA6ICR7IG5ldyBEYXRlKGFubm90YXRpb24udXBkYXRlZCl9XHJcblRhZ3MgOiAkeyBhbm5vdGF0aW9uLnRhZ3Muam9pbihcIiwgXCIpfVxyXG4gIGA7XHJcblxyXG59O1xyXG5cclxubGV0IHNvcnRBbmRTbGljZUNvbW1lbnRzID0gZnVuY3Rpb24gKHJhd19jb21tZW50czogYW55W10sIHNvcnRfb3JkZXI6IHN0cmluZywgZWxlbWVudHNUb1JldHVybjogbnVtYmVyKTogYW55W10ge1xyXG5cclxuICBsZXQgc29ydGVkX2NvbW1lbnRzID0gXy5zb3J0QnkocmF3X2NvbW1lbnRzLCBbZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG8udGltZTsgfV0pO1xyXG5cclxuICBpZiAoc29ydF9vcmRlciA9PT0gXCJuZXdfY29tbWVudHNfYXRfdG9wXCIpIHtcclxuICAgIHNvcnRlZF9jb21tZW50cyA9IF8uc29ydEJ5KHNvcnRlZF9jb21tZW50cywgW2Z1bmN0aW9uIChvKSB7IHJldHVybiAtMSAqIG8udGltZTsgfV0pO1xyXG4gIH0gZWxzZSBpZiAoc29ydF9vcmRlciA9PT0gXCJuZXdfY29tbWVudHNfYXRfYm90dG9tXCIpIHtcclxuICAgIHNvcnRlZF9jb21tZW50cyA9IF8uc29ydEJ5KHNvcnRlZF9jb21tZW50cywgW2Z1bmN0aW9uIChvKSB7IHJldHVybiBvLnRpbWU7IH1dKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBfLnRha2Uoc29ydGVkX2NvbW1lbnRzLCBlbGVtZW50c1RvUmV0dXJuKTtcclxuXHJcbn07XHJcblxyXG5sZXQgZ2V0UGFuZWxTdHlsZSA9IGZ1bmN0aW9uIChoaWdobGlnaHRfbmV3Q29tbWVudHNfY29sb3IpOiBzdHJpbmcge1xyXG5cclxuICByZXR1cm4gYFxyXG4gICAgQGtleWZyYW1lcyBibGlua2JnIHtcclxuICAgICAgICA1MCUge1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAke2hpZ2hsaWdodF9uZXdDb21tZW50c19jb2xvciB8fCBcIndoaXRlXCJ9O1xyXG4gICAgICAgICAgICBjb2xvcjogYmxhY2s7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gIGA7XHJcblxyXG59O1xyXG5cclxubGV0IGFwcGVuZExlYWRpbmdaZXJvZXMgPSBmdW5jdGlvbiAobikge1xyXG5cclxuICBpZiAobiA8PSA5KSB7XHJcbiAgICByZXR1cm4gXCIwXCIgKyBuO1xyXG4gIH1cclxuICByZXR1cm4gbjtcclxuXHJcbn1cclxuXHJcbkJvb21Db21tZW50c0N0bC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG5cclxuXHJcbiAgbGV0IHBhbmVsU3R5bGUgPSBnZXRQYW5lbFN0eWxlKHRoaXMuY3RybC5wYW5lbC5oaWdobGlnaHRfbmV3Q29tbWVudHNfY29sb3IpO1xyXG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcclxuICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcclxuICBzdHlsZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShwYW5lbFN0eWxlKSk7XHJcbiAgdGhpcy5lbGVtLmZpbmQoXCIjYm9vbS1jb21tZW50cy1zdHlsZVwiKS5odG1sKFwiXCIpO1xyXG4gIHRoaXMuZWxlbS5maW5kKFwiI2Jvb20tY29tbWVudHMtc3R5bGVcIikuYXBwZW5kKHN0eWxlKTtcclxuXHJcbiAgdGhpcy5jb21tZW50cyA9IFtdO1xyXG4gIHRoaXMucmF3X2NvbW1lbnRzID0gc29ydEFuZFNsaWNlQ29tbWVudHModGhpcy5yYXdfY29tbWVudHMsIHRoaXMucGFuZWwuY29tbWVudHNfb3JkZXIsICsodGhpcy5jdHJsLnBhbmVsLm51bWJlcl9vZl9jb21tZW50c190b19zaG93KSk7XHJcblxyXG4gIF8uZWFjaCh0aGlzLnJhd19jb21tZW50cywgKGFubm90YXRpb24pID0+IHtcclxuXHJcbiAgICBsZXQgY29tbWVudCA9IGFubm90YXRpb247XHJcbiAgICBjb21tZW50LmRpc3BsYXlUZXh0ID0gYCR7YW5ub3RhdGlvbi50ZXh0fWA7XHJcbiAgICBjb21tZW50LmRpc3BsYXlUaXRsZSA9IGdldFRvb2x0aXBNZXNzYWdlKGFubm90YXRpb24pO1xyXG5cclxuXHJcbiAgICBsZXQgYW5ub3RhdGlvbl9jcmVhdGVkX2RhdGUgPSBuZXcgRGF0ZShhbm5vdGF0aW9uLmNyZWF0ZWQpXHJcbiAgICBsZXQgZm9ybWF0dGVkX2RhdGUgPSBhbm5vdGF0aW9uX2NyZWF0ZWRfZGF0ZS5nZXRGdWxsWWVhcigpICsgXCItXCIgKyBhcHBlbmRMZWFkaW5nWmVyb2VzKChhbm5vdGF0aW9uX2NyZWF0ZWRfZGF0ZS5nZXRNb250aCgpICsgMSkpICsgXCItXCIgKyBhcHBlbmRMZWFkaW5nWmVyb2VzKGFubm90YXRpb25fY3JlYXRlZF9kYXRlLmdldERhdGUoKSkgKyBcIiBcIiArIGFwcGVuZExlYWRpbmdaZXJvZXMoYW5ub3RhdGlvbl9jcmVhdGVkX2RhdGUuZ2V0SG91cnMoKSkgKyBcIjpcIiArIGFwcGVuZExlYWRpbmdaZXJvZXMoYW5ub3RhdGlvbl9jcmVhdGVkX2RhdGUuZ2V0TWludXRlcygpKSArIFwiOlwiICsgYXBwZW5kTGVhZGluZ1plcm9lcyhhbm5vdGF0aW9uX2NyZWF0ZWRfZGF0ZS5nZXRTZWNvbmRzKCkpXHJcbiAgICBjb21tZW50LmRhdGUgPSBmb3JtYXR0ZWRfZGF0ZTtcclxuXHJcbiAgICBsZXQgZGlzcGxheV9jb21tZW50X2NsYXNzZXM6IGFueVtdID0gW107XHJcbiAgICBpZiAodGhpcy5jdHJsLnBhbmVsLmhpZ2hsaWdodF9uZXdDb21tZW50cyA9PT0gdHJ1ZSAmJiBjb21tZW50LmNyZWF0ZWQgPiAoKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAtICh0aGlzLmN0cmwucGFuZWwuaGlnaGxpZ2h0X25ld0NvbW1lbnRzX21pbnV0ZXMgKiA2MCAqIDEwMDApKSkge1xyXG4gICAgICBkaXNwbGF5X2NvbW1lbnRfY2xhc3Nlcy5wdXNoKFwiYmxpbmstY29tbWVudFwiKTtcclxuICAgIH1cclxuICAgIGNvbW1lbnQuZGlzcGxheUNsYXNzID0gZGlzcGxheV9jb21tZW50X2NsYXNzZXMuam9pbihcIiBcIik7XHJcblxyXG4gICAgY29tbWVudC5pbmxpbmVzdHlsZSA9IHt9O1xyXG4gICAgXy5lYWNoKGNvbW1lbnQudGFncywgdGFnID0+IHtcclxuICAgICAgaWYgKHRhZy50cmltKCkudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKFwiYm9vbS1iZ2NvbG9yPVwiKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbW1lbnQuaW5saW5lc3R5bGUuYmFja2dyb3VuZCA9IHRhZy50cmltKCkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiYm9vbS1iZ2NvbG9yPVwiLCBcIlwiKTtcclxuICAgICAgfSBlbHNlIGlmICh0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcImJvb20tY29sb3I9XCIpID09PSB0cnVlKSB7XHJcbiAgICAgICAgY29tbWVudC5pbmxpbmVzdHlsZS5jb2xvciA9IHRhZy50cmltKCkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKFwiYm9vbS1jb2xvcj1cIiwgXCJcIik7XHJcbiAgICAgIH0gZWxzZSBpZiAodGFnLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJib29tLWZvbnRzaXplPVwiKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbW1lbnQuaW5saW5lc3R5bGVbXCJmb250LXNpemVcIl0gPSB0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZShcImJvb20tZm9udHNpemU9XCIsIFwiXCIpICsgXCIlXCI7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY29tbWVudHMucHVzaChjb21tZW50KTtcclxuICB9KTtcclxuXHJcbn07XHJcblxyXG5leHBvcnQgeyBCb29tQ29tbWVudHNDdGwgYXMgUGFuZWxDdHJsIH07XHJcbiJdfQ==