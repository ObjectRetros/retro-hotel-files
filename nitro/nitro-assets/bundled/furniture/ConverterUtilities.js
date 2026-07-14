"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ConverterUtilities_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConverterUtilities = void 0;
const ora_1 = __importDefault(require("ora"));
const tsyringe_1 = require("tsyringe");
const common_1 = require("../common");
const swf_1 = require("../swf");
const EffectMapConverter_1 = require("./EffectMapConverter");
const FigureMapConverter_1 = require("./FigureMapConverter");
const FurnitureDataConverter_1 = require("./FurnitureDataConverter");
let ConverterUtilities = ConverterUtilities_1 = class ConverterUtilities {
    constructor(_furnitureDataConverter, _figureMapConverter, _effectMapConverter, _configuration) {
        this._furnitureDataConverter = _furnitureDataConverter;
        this._figureMapConverter = _figureMapConverter;
        this._effectMapConverter = _effectMapConverter;
        this._configuration = _configuration;
    }
    downloadSwfTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            const floorOnly = (this._configuration.getBoolean('convert.furniture.floor.only') || false);
            const wallOnly = (this._configuration.getBoolean('convert.furniture.wall.only') || false);
            for (const downloadType of ConverterUtilities_1.DOWNLOAD_SWF_TYPES) {
                if (!this._configuration.getBoolean(`convert.${downloadType}`))
                    continue;
                const now = Date.now();
                const spinner = (0, ora_1.default)(`Preparing ${downloadType}`).start();
                const downloadBase = this.getDownloadBaseUrl(downloadType);
                const saveDirectory = yield common_1.FileUtilities.getDirectory(`./assets/bundled/${downloadType}`);
                const classNamesWithRevisions = yield this.getClassNamesWithRevision(downloadType, floorOnly, wallOnly);
                const classNames = Object.keys(classNamesWithRevisions);
                if (classNames && classNames.length) {
                    const totalClassNames = classNames.length;
                    for (let i = 0; i < totalClassNames; i++) {
                        const className = classNames[i];
                        const revision = (classNamesWithRevisions[className] || '-1');
                        try {
                            const saveFile = new common_1.File(`${saveDirectory.path}/${className}.nitro`);
                            if (saveFile.exists())
                                continue;
                            spinner.text = `Converting: ${className} (${(i + 1)} / ${totalClassNames})`;
                            spinner.render();
                            const downloadUrl = swf_1.SWFDownloader.getDownloadUrl(downloadBase, className, revision);
                            const habboAssetSwf = yield swf_1.SWFDownloader.downloadFromUrl(downloadUrl);
                            if (!habboAssetSwf) {
                                console.log();
                                console.error(`Invalid SWF: ${className}`);
                                continue;
                            }
                            const nitroBundle = yield (0, swf_1.GenerateNitroBundleFromSwf)(habboAssetSwf);
                            yield saveFile.writeData(yield nitroBundle.toBufferAsync());
                            spinner.text = `Converted: ${className}`;
                            spinner.render();
                        }
                        catch (error) {
                            console.log();
                            console.error(`Error Converting: ${className} - ${error.message}`);
                            continue;
                        }
                    }
                }
                spinner.succeed(`Finished ${downloadType} in ${Date.now() - now}ms`);
            }
        });
    }
    getDownloadBaseUrl(type) {
        switch (type) {
            case 'furniture':
                return this._configuration.getValue('dynamic.download.furniture.url');
            case 'figure':
                return this._configuration.getValue('dynamic.download.figure.url');
            case 'effect':
                return this._configuration.getValue('dynamic.download.effect.url');
            case 'pet':
                return this._configuration.getValue('dynamic.download.pet.url');
        }
        return null;
    }
    getClassNamesWithRevision(type, floorOnly = false, wallOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (type) {
                case 'furniture':
                    return yield this._furnitureDataConverter.getClassNamesAndRevisions(floorOnly, wallOnly);
                case 'figure':
                    return yield this._figureMapConverter.getClassNamesAndRevisions();
                case 'effect':
                    return yield this._effectMapConverter.getClassNamesAndRevisions();
                case 'pet': {
                    const entries = {};
                    const classNames = this._configuration.getValue('pet.configuration').split(',');
                    for (const className of classNames)
                        entries[className] = '-1';
                    return entries;
                }
            }
            return null;
        });
    }
    extractNitroFromFolder() {
        var e_1, _a, e_2, _b, e_3, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const spinner = (0, ora_1.default)('Preparing Extraction').start();
            const extractBaseDirectory = yield common_1.FileUtilities.getDirectory('./assets/extract');
            const extractedBaseDirectory = yield common_1.FileUtilities.getDirectory('./assets/extracted');
            try {
                for (var _d = __asyncValues(ConverterUtilities_1.BUNDLE_TYPES), _e; _e = yield _d.next(), !_e.done;) {
                    const type = _e.value;
                    const extractTypeDirectory = yield common_1.FileUtilities.getDirectory(`${extractBaseDirectory.path}/${type}`);
                    const extractedTypeDirectory = yield common_1.FileUtilities.getDirectory(`${extractedBaseDirectory.path}/${type}`);
                    const files = yield extractTypeDirectory.getFileList();
                    try {
                        for (var files_1 = (e_2 = void 0, __asyncValues(files)), files_1_1; files_1_1 = yield files_1.next(), !files_1_1.done;) {
                            const name = files_1_1.value;
                            const [className, extension, ...rest] = name.split('.');
                            try {
                                spinner.text = `Extracting: ${className}`;
                                spinner.render();
                                const saveDirectory = yield common_1.FileUtilities.getDirectory(`${extractedTypeDirectory.path}/${className}`);
                                const file = new common_1.File(`${extractTypeDirectory.path}/${name}`);
                                if (extension === 'nitro') {
                                    const nitroBundle = common_1.NitroBundle.from((yield file.getContentsAsBuffer()).buffer);
                                    try {
                                        for (var _f = (e_3 = void 0, __asyncValues(nitroBundle.files.entries())), _g; _g = yield _f.next(), !_g.done;) {
                                            const [bundleName, bundleBuffer] = _g.value;
                                            const saveFile = new common_1.File(`${saveDirectory.path}/${bundleName}`);
                                            yield saveFile.writeData(bundleBuffer);
                                        }
                                    }
                                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                    finally {
                                        try {
                                            if (_g && !_g.done && (_c = _f.return)) yield _c.call(_f);
                                        }
                                        finally { if (e_3) throw e_3.error; }
                                    }
                                    spinner.text = `Extracted: ${className}`;
                                    spinner.render();
                                }
                            }
                            catch (error) {
                                console.log();
                                console.error(`Error Extracting: ${name} - ${error.message}`);
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (files_1_1 && !files_1_1.done && (_b = files_1.return)) yield _b.call(files_1);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) yield _a.call(_d);
                }
                finally { if (e_1) throw e_1.error; }
            }
            spinner.succeed(`Extraction: Finished in ${Date.now() - now}ms`);
        });
    }
    convertSwfFromFolder() {
        var e_4, _a, e_5, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const spinner = (0, ora_1.default)('Preparing SWF Extraction').start();
            const swfBaseDirectory = yield common_1.FileUtilities.getDirectory('./assets/swf');
            const bundledBaseDirectory = yield common_1.FileUtilities.getDirectory('./assets/bundled');
            try {
                for (var _c = __asyncValues(ConverterUtilities_1.BUNDLE_TYPES), _d; _d = yield _c.next(), !_d.done;) {
                    const type = _d.value;
                    const swfTypeDirectory = yield common_1.FileUtilities.getDirectory(`${swfBaseDirectory.path}/${type}`);
                    const bundledTypeDirectory = yield common_1.FileUtilities.getDirectory(`${bundledBaseDirectory.path}/${type}`);
                    const files = yield swfTypeDirectory.getFileList();
                    try {
                        for (var files_2 = (e_5 = void 0, __asyncValues(files)), files_2_1; files_2_1 = yield files_2.next(), !files_2_1.done;) {
                            const name = files_2_1.value;
                            const [className, extension, ...rest] = name.split('.');
                            try {
                                spinner.text = `Extracting SWF: ${className}`;
                                spinner.render();
                                const downloadUrl = `${swfTypeDirectory.path}/${className}.swf`;
                                const habboAssetSwf = yield swf_1.SWFDownloader.downloadFromUrl(downloadUrl);
                                if (!habboAssetSwf) {
                                    console.log();
                                    console.error(`Invalid SWF: ${downloadUrl}`);
                                    continue;
                                }
                                const nitroBundle = yield (0, swf_1.GenerateNitroBundleFromSwf)(habboAssetSwf);
                                if (!nitroBundle) {
                                    console.log();
                                    console.error(`Invalid SWF Bundle: ${downloadUrl}`);
                                    continue;
                                }
                                const saveFile = new common_1.File(`${bundledTypeDirectory.path}/${className}.nitro`);
                                yield saveFile.writeData(yield nitroBundle.toBufferAsync());
                                spinner.text = `Extracted SWF: ${className}`;
                                spinner.render();
                            }
                            catch (error) {
                                console.log();
                                console.error(`Error Extracting: ${name} - ${error.message}`);
                            }
                        }
                    }
                    catch (e_5_1) { e_5 = { error: e_5_1 }; }
                    finally {
                        try {
                            if (files_2_1 && !files_2_1.done && (_b = files_2.return)) yield _b.call(files_2);
                        }
                        finally { if (e_5) throw e_5.error; }
                    }
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) yield _a.call(_c);
                }
                finally { if (e_4) throw e_4.error; }
            }
            spinner.succeed(`SWF Extraction: Finished in ${Date.now() - now}ms`);
        });
    }
    bundleExtractedFromFolder() {
        var e_6, _a, e_7, _b, e_8, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const now = Date.now();
            const spinner = (0, ora_1.default)('Preparing Bundler').start();
            const bundleBaseDirectory = yield common_1.FileUtilities.getDirectory('./assets/extracted');
            const bundledBaseDirectory = yield common_1.FileUtilities.getDirectory('./assets/bundled');
            try {
                for (var _d = __asyncValues(ConverterUtilities_1.BUNDLE_TYPES), _e; _e = yield _d.next(), !_e.done;) {
                    const type = _e.value;
                    const bundleTypeDirectory = yield common_1.FileUtilities.getDirectory(`${bundleBaseDirectory.path}/${type}`);
                    const bundledTypeDirectory = yield common_1.FileUtilities.getDirectory(`${bundledBaseDirectory.path}/${type}`);
                    const files = yield bundleTypeDirectory.getFileList();
                    try {
                        for (var files_3 = (e_7 = void 0, __asyncValues(files)), files_3_1; files_3_1 = yield files_3.next(), !files_3_1.done;) {
                            const name = files_3_1.value;
                            const [className, extension, ...rest] = name.split('.');
                            try {
                                const bundleDirectory = new common_1.File(`${bundleTypeDirectory.path}/${name}`);
                                if (!(yield bundleDirectory.isDirectory()))
                                    continue;
                                spinner.text = `Bundling: ${className}`;
                                spinner.render();
                                const nitroBundle = new common_1.NitroBundle();
                                const childFiles = yield bundleDirectory.getFileList();
                                if (childFiles && childFiles.length) {
                                    try {
                                        for (var childFiles_1 = (e_8 = void 0, __asyncValues(childFiles)), childFiles_1_1; childFiles_1_1 = yield childFiles_1.next(), !childFiles_1_1.done;) {
                                            const childName = childFiles_1_1.value;
                                            const childFile = new common_1.File(`${bundleDirectory.path}/${childName}`);
                                            nitroBundle.addFile(childName, yield childFile.getContentsAsBuffer());
                                        }
                                    }
                                    catch (e_8_1) { e_8 = { error: e_8_1 }; }
                                    finally {
                                        try {
                                            if (childFiles_1_1 && !childFiles_1_1.done && (_c = childFiles_1.return)) yield _c.call(childFiles_1);
                                        }
                                        finally { if (e_8) throw e_8.error; }
                                    }
                                }
                                if (nitroBundle.totalFiles) {
                                    const saveFile = new common_1.File(`${bundledTypeDirectory.path}/${className}.nitro`);
                                    yield saveFile.writeData(yield nitroBundle.toBufferAsync());
                                }
                                else {
                                    console.log();
                                    console.error(`Error Bundling: ${name} - The bundle was empty`);
                                    continue;
                                }
                                spinner.text = `Bundled: ${name}`;
                                spinner.render();
                            }
                            catch (error) {
                                console.log();
                                console.error(`Error Bundling: ${name} - ${error.message}`);
                            }
                        }
                    }
                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                    finally {
                        try {
                            if (files_3_1 && !files_3_1.done && (_b = files_3.return)) yield _b.call(files_3);
                        }
                        finally { if (e_7) throw e_7.error; }
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) yield _a.call(_d);
                }
                finally { if (e_6) throw e_6.error; }
            }
            spinner.succeed(`Bundler: Finished in ${Date.now() - now}ms`);
        });
    }
};
ConverterUtilities.BUNDLE_TYPES = ['furniture', 'figure', 'effect', 'pet', 'generic'];
ConverterUtilities.DOWNLOAD_SWF_TYPES = ['furniture', 'figure', 'effect', 'pet'];
ConverterUtilities = ConverterUtilities_1 = __decorate([
    (0, tsyringe_1.singleton)(),
    __metadata("design:paramtypes", [FurnitureDataConverter_1.FurnitureDataConverter,
        FigureMapConverter_1.FigureMapConverter,
        EffectMapConverter_1.EffectMapConverter,
        common_1.Configuration])
], ConverterUtilities);
exports.ConverterUtilities = ConverterUtilities;
