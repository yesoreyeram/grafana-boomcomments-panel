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
                    var formatted_date = annotation_created_date.getFullYear()
                        + "-"
                        + appendLeadingZeroes((annotation_created_date.getMonth() + 1))
                        + "-"
                        + appendLeadingZeroes(annotation_created_date.getDate())
                        + " "
                        + appendLeadingZeroes(annotation_created_date.getHours())
                        + ":"
                        + appendLeadingZeroes(annotation_created_date.getMinutes())
                        + ":"
                        + appendLeadingZeroes(annotation_created_date.getSeconds());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7WUFLSSxTQUFTLEdBQUcsZ0NBQWdDLENBQUM7WUFFM0MsTUFBTSxHQUFHO2dCQUNiLHlCQUF5QixFQUFFO29CQUN6QixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRTtvQkFDN0IsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7aUJBQ3BDO2dCQUNELFdBQVcsRUFBRSxjQUFjO2dCQUMzQixjQUFjLEVBQUU7b0JBQ2QsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFO29CQUM3RCxFQUFFLElBQUksRUFBRSx3QkFBd0IsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLEVBQUU7aUJBQ3BFO2dCQUNELFNBQVMsRUFBRTtvQkFDVCxJQUFJLEVBQUUsYUFBVyxTQUFTLDBCQUF1QjtvQkFDakQsS0FBSyxFQUFFLGFBQVcsU0FBUywyQkFBd0I7aUJBQ3BEO2dCQUNELG1CQUFtQixFQUFFLHNCQUFzQjtnQkFDM0MsVUFBVSxFQUFFO29CQUNWO3dCQUNFLFFBQVEsRUFBRSxDQUFDO3dCQUNYLFlBQVksRUFBRSxvQkFBa0IsU0FBUywyQkFBd0I7d0JBQ2pFLEtBQUssRUFBRSxlQUFlO3FCQUN2QjtpQkFDRjtnQkFDRCxjQUFjLEVBQUU7b0JBQ2QsWUFBWSxFQUFFLGVBQWU7b0JBQzdCLFlBQVksRUFBRSxnQkFBZ0I7b0JBQzlCLGFBQWEsRUFBRSxnQkFBZ0I7b0JBQy9CLE9BQU8sRUFBRSxTQUFTO29CQUNsQixNQUFNLEVBQUUsUUFBUTtpQkFDakI7YUFDRixDQUFDO1lBR0YsbUJBQWEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7O2dCQUVGLG1DQUFTO2dCQTZCckMseUJBQVks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QyxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7eUJBQ2pGOzZCQUFNLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLElBQUksRUFBRTs0QkFDekUsT0FBTyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQzt5QkFDakc7b0JBQ0gsQ0FBQyxDQUFDLENBQUM7b0JBRUgsS0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlCLENBQUMsQ0FBQyxDQUFDO1lBRUwsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vPHJlZmVyZW5jZSBwYXRoPVwiLi4vbm9kZV9tb2R1bGVzL2dyYWZhbmEtc2RrLW1vY2tzL2FwcC9oZWFkZXJzL2NvbW1vbi5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcclxuaW1wb3J0IHsgUGFuZWxDdHJsLCBsb2FkUGx1Z2luQ3NzIH0gZnJvbSBcImFwcC9wbHVnaW5zL3Nka1wiO1xyXG5cclxubGV0IFBMVUdJTl9JRCA9IFwieWVzb3JleWVyYW0tYm9vbWNvbW1lbnRzLXBhbmVsXCI7XHJcblxyXG5jb25zdCBDT05GSUcgPSB7XHJcbiAgY29tbWVudF9wb3N0Ym94X3Bvc2l0aW9uczogW1xyXG4gICAgeyB0ZXh0OiBcIlRvcFwiLCB2YWx1ZTogXCJ0b3BcIiB9LFxyXG4gICAgeyB0ZXh0OiBcIkJvdHRvbVwiLCB2YWx1ZTogXCJib3R0b21cIiB9LFxyXG4gIF0sXHJcbiAgY29tbWVudF90YWc6IFwiYm9vbS1jb21tZW50XCIsXHJcbiAgY29tbWVudHNfb3JkZXI6IFtcclxuICAgIHsgdGV4dDogXCJOZXcgQ29tbWVudHMgYXQgVG9wXCIsIHZhbHVlOiBcIm5ld19jb21tZW50c19hdF90b3BcIiB9LFxyXG4gICAgeyB0ZXh0OiBcIk5ldyBDb21tZW50cyBhdCBCb3R0b21cIiwgdmFsdWU6IFwibmV3X2NvbW1lbnRzX2F0X2JvdHRvbVwiIH0sXHJcbiAgXSxcclxuICBjc3NUaGVtZXM6IHtcclxuICAgIGRhcms6IGBwbHVnaW5zLyR7UExVR0lOX0lEfS9jc3MvZGVmYXVsdC5kYXJrLmNzc2AsXHJcbiAgICBsaWdodDogYHBsdWdpbnMvJHtQTFVHSU5fSUR9L2Nzcy9kZWZhdWx0LmxpZ2h0LmNzc2BcclxuICB9LFxyXG4gIGRlZmF1bHRfdGVtcGxhdGVVUkw6IFwicGFydGlhbHMvbW9kdWxlLmh0bWxcIixcclxuICBlZGl0b3JUYWJzOiBbXHJcbiAgICB7XHJcbiAgICAgIHBvc2l0aW9uOiAyLFxyXG4gICAgICB0ZW1wbGF0ZVBhdGg6IGBwdWJsaWMvcGx1Z2lucy8ke1BMVUdJTl9JRH0vcGFydGlhbHMvb3B0aW9ucy5odG1sYCxcclxuICAgICAgdGl0bGU6IFwiUGFuZWwgT3B0aW9uc1wiXHJcbiAgICB9XHJcbiAgXSxcclxuICBncmFmYW5hX2V2ZW50czoge1xyXG4gICAgZGF0YVJlY2VpdmVkOiBcImRhdGEtcmVjZWl2ZWRcIixcclxuICAgIGluaXRFZGl0TW9kZTogXCJpbml0LWVkaXQtbW9kZVwiLFxyXG4gICAgcGFuZWxUZWFyZG93bjogXCJwYW5lbC10ZWFyZG93blwiLFxyXG4gICAgcmVmcmVzaDogXCJyZWZyZXNoXCIsXHJcbiAgICByZW5kZXI6IFwicmVuZGVyXCJcclxuICB9XHJcbn07XHJcblxyXG5cclxubG9hZFBsdWdpbkNzcyhDT05GSUcuY3NzVGhlbWVzKTtcclxuXHJcbmNsYXNzIEJvb21Db21tZW50c0N0bCBleHRlbmRzIFBhbmVsQ3RybCB7XHJcblxyXG4gIHB1YmxpYyBzdGF0aWMgdGVtcGxhdGVVcmwgPSBDT05GSUcuZGVmYXVsdF90ZW1wbGF0ZVVSTDtcclxuICBwdWJsaWMgc2NvcGU6IGFueTtcclxuICBwdWJsaWMgY3RybDogYW55O1xyXG4gIHB1YmxpYyBlbGVtOiBhbnk7XHJcbiAgcHVibGljIGF0dHJzOiBhbnk7XHJcbiAgcHVibGljICRodHRwOiBhbnk7XHJcbiAgcHVibGljIGJhY2tlbmRTcnY6IGFueTtcclxuICBwdWJsaWMgbmV4dFRpY2tQcm9taXNlOiBhbnk7XHJcbiAgcHVibGljIHJhd19jb21tZW50czogYW55W10gPSBbXTtcclxuICBwdWJsaWMgY29tbWVudHM6IGFueVtdID0gW107XHJcbiAgcHVibGljIGFjdGl2ZUVkaXRvclRhYkluZGV4ID0gLTI7XHJcbiAgcHVibGljIGNvbW1lbnRfcG9zdGJveF9wb3NpdGlvbnMgPSBDT05GSUcuY29tbWVudF9wb3N0Ym94X3Bvc2l0aW9ucztcclxuICBwdWJsaWMgY29tbWVudHNfb3JkZXIgPSBDT05GSUcuY29tbWVudHNfb3JkZXI7XHJcblxyXG4gIHB1YmxpYyBwYW5lbERlZmF1bHRzID0ge1xyXG5cclxuICAgIGNvbW1lbnRfcG9zdGJveF9wb3NpdGlvbjogXCJib3R0b21cIixcclxuICAgIGNvbW1lbnRzX29yZGVyOiBcIm5ld19jb21tZW50c19hdF90b3BcIixcclxuICAgIGVuYWJsZV9pbmxpbmVfY29tbWVudGJveDogZmFsc2UsXHJcbiAgICBoaWdobGlnaHRfbmV3Q29tbWVudHM6IHRydWUsXHJcbiAgICBoaWdobGlnaHRfbmV3Q29tbWVudHNfY29sb3I6IFwieWVsbG93XCIsXHJcbiAgICBoaWdobGlnaHRfbmV3Q29tbWVudHNfbWludXRlczogMyxcclxuICAgIG51bWJlcl9vZl9jb21tZW50c190b19zaG93OiA1LFxyXG4gICAgcmVmcmVzaF9mcmVxdWVuY3k6IDEwXHJcblxyXG4gIH07XHJcblxyXG4gIGNvbnN0cnVjdG9yKCRzY29wZSwgJGluamVjdG9yLCAkaHR0cCwgYmFja2VuZFNydikge1xyXG5cclxuICAgIHN1cGVyKCRzY29wZSwgJGluamVjdG9yKTtcclxuICAgIF8uZGVmYXVsdHNEZWVwKHRoaXMucGFuZWwsIHRoaXMucGFuZWxEZWZhdWx0cyk7XHJcblxyXG4gICAgdGhpcy4kaHR0cCA9ICRodHRwO1xyXG4gICAgdGhpcy5iYWNrZW5kU3J2ID0gYmFja2VuZFNydjtcclxuXHJcbiAgICB0aGlzLmV2ZW50cy5vbihDT05GSUcuZ3JhZmFuYV9ldmVudHMuaW5pdEVkaXRNb2RlLCB0aGlzLm9uSW5pdEVkaXRNb2RlLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5ldmVudHMub24oQ09ORklHLmdyYWZhbmFfZXZlbnRzLnBhbmVsVGVhcmRvd24sIHRoaXMub25QYW5lbFRlYXJkb3duLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5ldmVudHMub24oQ09ORklHLmdyYWZhbmFfZXZlbnRzLnJlZnJlc2gsIHRoaXMucmVmcmVzaENvbW1lbnRzLmJpbmQodGhpcykpO1xyXG4gICAgdGhpcy5ldmVudHMub24oQ09ORklHLmdyYWZhbmFfZXZlbnRzLnJlbmRlciwgdGhpcy5yZWZyZXNoQ29tbWVudHMuYmluZCh0aGlzKSk7XHJcblxyXG4gICAgdGhpcy5yZWZyZXNoQ29tbWVudHMoKTtcclxuXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIG9uUGFuZWxUZWFyZG93bigpIHtcclxuXHJcbiAgICB0aGlzLiR0aW1lb3V0LmNhbmNlbCh0aGlzLm5leHRUaWNrUHJvbWlzZSk7XHJcblxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBvbkluaXRFZGl0TW9kZSgpOiB2b2lkIHtcclxuXHJcbiAgICBfLmVhY2goQ09ORklHLmVkaXRvclRhYnMsIGVkaXRvclRhYiA9PiB7XHJcbiAgICAgIHRoaXMuYWRkRWRpdG9yVGFiKGVkaXRvclRhYi50aXRsZSwgZWRpdG9yVGFiLnRlbXBsYXRlUGF0aCwgZWRpdG9yVGFiLnBvc2l0aW9uKTtcclxuICAgIH0pO1xyXG5cclxuICB9XHJcblxyXG4gIHB1YmxpYyBhZGRDb21tZW50KGNvbW1lbnRfdHlwZTogc3RyaW5nKTogdm9pZCB7XHJcblxyXG4gICAgaWYgKHRoaXMuY3RybC5jb21tZW50X3RleHQgJiYgdGhpcy5jdHJsLmNvbW1lbnRfdGV4dCAhPT0gXCJcIikge1xyXG5cclxuICAgICAgbGV0IGNvbW1lbnRPcHRpb25zOiBhbnkgPSB7XHJcbiAgICAgICAgXCJ0YWdzXCI6IFtDT05GSUcuY29tbWVudF90YWddLFxyXG4gICAgICAgIFwidGV4dFwiOiBgJHt0aGlzLmN0cmwuY29tbWVudF90ZXh0fWBcclxuICAgICAgfTtcclxuXHJcbiAgICAgIGlmIChjb21tZW50X3R5cGUgPT09IFwidGhpc19kYXNoYm9hcmRcIiAmJiB0aGlzLmRhc2hib2FyZC5pZCkge1xyXG4gICAgICAgIGNvbW1lbnRPcHRpb25zLmRhc2hib2FyZElkID0gdGhpcy5kYXNoYm9hcmQuaWQ7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF90YWdzICYmIHRoaXMuY3RybC5jb21tZW50X3RhZ3MgIT09IFwiXCIpIHtcclxuICAgICAgICBfLmVhY2godGhpcy5jdHJsLmNvbW1lbnRfdGFncy5zcGxpdChcIjtcIikubWFwKHQgPT4gdC50cmltKCkpLCB0YWcgPT4ge1xyXG4gICAgICAgICAgY29tbWVudE9wdGlvbnMudGFncy5wdXNoKHRhZyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF9iZ0NvbG9yICYmIHRoaXMuY3RybC5jb21tZW50X2JnQ29sb3IgIT09IFwiXCIpIHtcclxuICAgICAgICBjb21tZW50T3B0aW9ucy50YWdzLnB1c2goYGJvb20tYmdjb2xvcj0ke3RoaXMuY3RybC5jb21tZW50X2JnQ29sb3J9YCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLmN0cmwuY29tbWVudF90ZXh0Q29sb3IgJiYgdGhpcy5jdHJsLmNvbW1lbnRfdGV4dENvbG9yICE9PSBcIlwiKSB7XHJcbiAgICAgICAgY29tbWVudE9wdGlvbnMudGFncy5wdXNoKGBib29tLWNvbG9yPSR7dGhpcy5jdHJsLmNvbW1lbnRfdGV4dENvbG9yfWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAodGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgJiYgdGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgIT09IFwiXCIpIHtcclxuICAgICAgICBjb21tZW50T3B0aW9ucy50YWdzLnB1c2goYGJvb20tZm9udHNpemU9JHt0aGlzLmN0cmwuY29tbWVudF9mb250U2l6ZSB8fCBcIjEwMFwifWApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLmJhY2tlbmRTcnYucG9zdCgnL2FwaS9hbm5vdGF0aW9ucycsIGNvbW1lbnRPcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcIkNvbW1lbnQgYWRkZWRcIiwgcmVzcG9uc2UpO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RleHQgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RhZ3MgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X2JnQ29sb3IgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMuY3RybC5jb21tZW50X3RleHRDb2xvciA9IFwiXCI7XHJcbiAgICAgICAgdGhpcy5jdHJsLmNvbW1lbnRfZm9udFNpemUgPSBcIlwiO1xyXG4gICAgICAgIHRoaXMucmVmcmVzaENvbW1lbnRzKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVmcmVzaENvbW1lbnRzKCk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMuJHRpbWVvdXQuY2FuY2VsKHRoaXMubmV4dFRpY2tQcm9taXNlKTtcclxuXHJcbiAgICBsZXQgYW5ub3RhdGlvbnNfdXJsID0gYC9hcGkvYW5ub3RhdGlvbnM/YDtcclxuICAgIGFubm90YXRpb25zX3VybCArPSBgdGFncz1ib29tLWNvbW1lbnRgO1xyXG4gICAgYW5ub3RhdGlvbnNfdXJsICs9IGAmbGltaXQ9JHt0aGlzLnBhbmVsLm51bWJlcl9vZl9jb21tZW50c190b19zaG93IHx8IDEwfWA7XHJcbiAgICBhbm5vdGF0aW9uc191cmwgKz0gYCR7dGhpcy5wYW5lbC5zaG93X3RoaXNfZGFzaGJvYXJkX29ubHkgPT09IHRydWUgPyBcIiZkYXNoYm9hcmRJZD1cIiArIHRoaXMuZGFzaGJvYXJkLmlkIDogXCJcIn1gO1xyXG5cclxuICAgIHRoaXMuYmFja2VuZFNydi5nZXQoYW5ub3RhdGlvbnNfdXJsKS50aGVuKGFubm90YXRpb25zID0+IHtcclxuICAgICAgdGhpcy5yYXdfY29tbWVudHMgPSBhbm5vdGF0aW9ucztcclxuICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMubmV4dFRpY2tQcm9taXNlID0gdGhpcy4kdGltZW91dCh0aGlzLnJlZnJlc2hDb21tZW50cy5iaW5kKHRoaXMpLCB0aGlzLnBhbmVsLnJlZnJlc2hfZnJlcXVlbmN5ICogMTAwMCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgbGluayhzY29wZTogYW55LCBlbGVtOiBhbnksIGF0dHJzOiBhbnksIGN0cmw6IGFueSk6IHZvaWQge1xyXG5cclxuICAgIHRoaXMuc2NvcGUgPSBzY29wZTtcclxuICAgIHRoaXMuZWxlbSA9IGVsZW07XHJcbiAgICB0aGlzLmF0dHJzID0gYXR0cnM7XHJcblxyXG4gICAgdGhpcy5jdHJsID0gY3RybDtcclxuICB9XHJcblxyXG59XHJcblxyXG5sZXQgZ2V0VG9vbHRpcE1lc3NhZ2UgPSBmdW5jdGlvbiAoYW5ub3RhdGlvbjogYW55KTogc3RyaW5nIHtcclxuXHJcbiAgcmV0dXJuIGBcclxuJHthbm5vdGF0aW9uLnRleHR9XHJcblxyXG5NZXNzYWdlIGJ5IDogJHthbm5vdGF0aW9uLmxvZ2lufSAoJHthbm5vdGF0aW9uLmVtYWlsfSlcclxuQ3JlYXRlZCBhdCA6ICR7IG5ldyBEYXRlKGFubm90YXRpb24uY3JlYXRlZCl9XHJcblVwZGF0ZWQgYXQgOiAkeyBuZXcgRGF0ZShhbm5vdGF0aW9uLnVwZGF0ZWQpfVxyXG5UYWdzIDogJHsgYW5ub3RhdGlvbi50YWdzLmpvaW4oXCIsIFwiKX1cclxuICBgO1xyXG5cclxufTtcclxuXHJcbmxldCBzb3J0QW5kU2xpY2VDb21tZW50cyA9IGZ1bmN0aW9uIChyYXdfY29tbWVudHM6IGFueVtdLCBzb3J0X29yZGVyOiBzdHJpbmcsIGVsZW1lbnRzVG9SZXR1cm46IG51bWJlcik6IGFueVtdIHtcclxuXHJcbiAgbGV0IHNvcnRlZF9jb21tZW50cyA9IF8uc29ydEJ5KHJhd19jb21tZW50cywgW2Z1bmN0aW9uIChvKSB7IHJldHVybiBvLnRpbWU7IH1dKTtcclxuXHJcbiAgaWYgKHNvcnRfb3JkZXIgPT09IFwibmV3X2NvbW1lbnRzX2F0X3RvcFwiKSB7XHJcbiAgICBzb3J0ZWRfY29tbWVudHMgPSBfLnNvcnRCeShzb3J0ZWRfY29tbWVudHMsIFtmdW5jdGlvbiAobykgeyByZXR1cm4gLTEgKiBvLnRpbWU7IH1dKTtcclxuICB9IGVsc2UgaWYgKHNvcnRfb3JkZXIgPT09IFwibmV3X2NvbW1lbnRzX2F0X2JvdHRvbVwiKSB7XHJcbiAgICBzb3J0ZWRfY29tbWVudHMgPSBfLnNvcnRCeShzb3J0ZWRfY29tbWVudHMsIFtmdW5jdGlvbiAobykgeyByZXR1cm4gby50aW1lOyB9XSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gXy50YWtlKHNvcnRlZF9jb21tZW50cywgZWxlbWVudHNUb1JldHVybik7XHJcblxyXG59O1xyXG5cclxubGV0IGdldFBhbmVsU3R5bGUgPSBmdW5jdGlvbiAoaGlnaGxpZ2h0X25ld0NvbW1lbnRzX2NvbG9yKTogc3RyaW5nIHtcclxuXHJcbiAgcmV0dXJuIGBcclxuICAgIEBrZXlmcmFtZXMgYmxpbmtiZyB7XHJcbiAgICAgICAgNTAlIHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogJHtoaWdobGlnaHRfbmV3Q29tbWVudHNfY29sb3IgfHwgXCJ3aGl0ZVwifTtcclxuICAgICAgICAgICAgY29sb3I6IGJsYWNrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICBgO1xyXG5cclxufTtcclxuXHJcbmxldCBhcHBlbmRMZWFkaW5nWmVyb2VzID0gZnVuY3Rpb24gKG4pIHtcclxuXHJcbiAgaWYgKG4gPD0gOSkge1xyXG4gICAgcmV0dXJuIFwiMFwiICsgbjtcclxuICB9XHJcbiAgcmV0dXJuIG47XHJcblxyXG59O1xyXG5cclxuQm9vbUNvbW1lbnRzQ3RsLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG5cclxuICBsZXQgcGFuZWxTdHlsZSA9IGdldFBhbmVsU3R5bGUodGhpcy5jdHJsLnBhbmVsLmhpZ2hsaWdodF9uZXdDb21tZW50c19jb2xvcik7XHJcbiAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xyXG4gIHN0eWxlLnR5cGUgPSAndGV4dC9jc3MnO1xyXG4gIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHBhbmVsU3R5bGUpKTtcclxuICB0aGlzLmVsZW0uZmluZChcIiNib29tLWNvbW1lbnRzLXN0eWxlXCIpLmh0bWwoXCJcIik7XHJcbiAgdGhpcy5lbGVtLmZpbmQoXCIjYm9vbS1jb21tZW50cy1zdHlsZVwiKS5hcHBlbmQoc3R5bGUpO1xyXG5cclxuICB0aGlzLmNvbW1lbnRzID0gW107XHJcbiAgdGhpcy5yYXdfY29tbWVudHMgPSBzb3J0QW5kU2xpY2VDb21tZW50cyh0aGlzLnJhd19jb21tZW50cywgdGhpcy5wYW5lbC5jb21tZW50c19vcmRlciwgKyh0aGlzLmN0cmwucGFuZWwubnVtYmVyX29mX2NvbW1lbnRzX3RvX3Nob3cpKTtcclxuXHJcbiAgXy5lYWNoKHRoaXMucmF3X2NvbW1lbnRzLCAoYW5ub3RhdGlvbikgPT4ge1xyXG5cclxuICAgIGxldCBjb21tZW50ID0gYW5ub3RhdGlvbjtcclxuICAgIGNvbW1lbnQuZGlzcGxheVRleHQgPSBgJHthbm5vdGF0aW9uLnRleHR9YDtcclxuICAgIGNvbW1lbnQuZGlzcGxheVRpdGxlID0gZ2V0VG9vbHRpcE1lc3NhZ2UoYW5ub3RhdGlvbik7XHJcblxyXG5cclxuICAgIGxldCBhbm5vdGF0aW9uX2NyZWF0ZWRfZGF0ZSA9IG5ldyBEYXRlKGFubm90YXRpb24uY3JlYXRlZCk7XHJcbiAgICBsZXQgZm9ybWF0dGVkX2RhdGUgPSBhbm5vdGF0aW9uX2NyZWF0ZWRfZGF0ZS5nZXRGdWxsWWVhcigpXHJcbiAgICAgICsgXCItXCJcclxuICAgICAgKyBhcHBlbmRMZWFkaW5nWmVyb2VzKChhbm5vdGF0aW9uX2NyZWF0ZWRfZGF0ZS5nZXRNb250aCgpICsgMSkpXHJcbiAgICAgICsgXCItXCJcclxuICAgICAgKyBhcHBlbmRMZWFkaW5nWmVyb2VzKGFubm90YXRpb25fY3JlYXRlZF9kYXRlLmdldERhdGUoKSlcclxuICAgICAgKyBcIiBcIlxyXG4gICAgICArIGFwcGVuZExlYWRpbmdaZXJvZXMoYW5ub3RhdGlvbl9jcmVhdGVkX2RhdGUuZ2V0SG91cnMoKSlcclxuICAgICAgKyBcIjpcIlxyXG4gICAgICArIGFwcGVuZExlYWRpbmdaZXJvZXMoYW5ub3RhdGlvbl9jcmVhdGVkX2RhdGUuZ2V0TWludXRlcygpKVxyXG4gICAgICArIFwiOlwiXHJcbiAgICAgICsgYXBwZW5kTGVhZGluZ1plcm9lcyhhbm5vdGF0aW9uX2NyZWF0ZWRfZGF0ZS5nZXRTZWNvbmRzKCkpO1xyXG4gICAgY29tbWVudC5kYXRlID0gZm9ybWF0dGVkX2RhdGU7XHJcblxyXG4gICAgbGV0IGRpc3BsYXlfY29tbWVudF9jbGFzc2VzOiBhbnlbXSA9IFtdO1xyXG4gICAgaWYgKHRoaXMuY3RybC5wYW5lbC5oaWdobGlnaHRfbmV3Q29tbWVudHMgPT09IHRydWUgJiYgY29tbWVudC5jcmVhdGVkID4gKChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLSAodGhpcy5jdHJsLnBhbmVsLmhpZ2hsaWdodF9uZXdDb21tZW50c19taW51dGVzICogNjAgKiAxMDAwKSkpIHtcclxuICAgICAgZGlzcGxheV9jb21tZW50X2NsYXNzZXMucHVzaChcImJsaW5rLWNvbW1lbnRcIik7XHJcbiAgICB9XHJcbiAgICBjb21tZW50LmRpc3BsYXlDbGFzcyA9IGRpc3BsYXlfY29tbWVudF9jbGFzc2VzLmpvaW4oXCIgXCIpO1xyXG5cclxuICAgIGNvbW1lbnQuaW5saW5lc3R5bGUgPSB7fTtcclxuICAgIF8uZWFjaChjb21tZW50LnRhZ3MsIHRhZyA9PiB7XHJcbiAgICAgIGlmICh0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChcImJvb20tYmdjb2xvcj1cIikgPT09IHRydWUpIHtcclxuICAgICAgICBjb21tZW50LmlubGluZXN0eWxlLmJhY2tncm91bmQgPSB0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZShcImJvb20tYmdjb2xvcj1cIiwgXCJcIik7XHJcbiAgICAgIH0gZWxzZSBpZiAodGFnLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoXCJib29tLWNvbG9yPVwiKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbW1lbnQuaW5saW5lc3R5bGUuY29sb3IgPSB0YWcudHJpbSgpLnRvTG93ZXJDYXNlKCkucmVwbGFjZShcImJvb20tY29sb3I9XCIsIFwiXCIpO1xyXG4gICAgICB9IGVsc2UgaWYgKHRhZy50cmltKCkudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKFwiYm9vbS1mb250c2l6ZT1cIikgPT09IHRydWUpIHtcclxuICAgICAgICBjb21tZW50LmlubGluZXN0eWxlW1wiZm9udC1zaXplXCJdID0gdGFnLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoXCJib29tLWZvbnRzaXplPVwiLCBcIlwiKSArIFwiJVwiO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNvbW1lbnRzLnB1c2goY29tbWVudCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0IHsgQm9vbUNvbW1lbnRzQ3RsIGFzIFBhbmVsQ3RybCB9O1xyXG4iXX0=