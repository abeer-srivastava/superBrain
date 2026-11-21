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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
let UserService = class UserService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    create(data) {
        return this.userModel.create(data);
    }
    findByUsername(username) {
        return this.userModel.findOne({ username }).exec();
    }
    findByEmail(email) {
        return this.userModel.findOne({ email: email.toLowerCase() }).exec();
    }
    findByIdentifierWithSecret(identifier) {
        const query = identifier.includes('@')
            ? { email: identifier.toLowerCase() }
            : { username: identifier };
        return this.userModel.findOne(query).select('+passwordHash').exec();
    }
    findByIdWithSecret(id) {
        return this.userModel.findById(id).select('+passwordHash').exec();
    }
    findById(id) {
        return this.userModel.findById(id).exec();
    }
    async update(id, updates) {
        const { $inc, ...set } = updates;
        return this.userModel
            .findByIdAndUpdate(id, { $set: set, ...($inc ? { $inc } : {}) }, { returnDocument: 'after' })
            .exec();
    }
    async bumpTokenVersion(id) {
        return this.userModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }, { returnDocument: 'after' }).exec();
    }
    async deleteById(id) {
        await this.userModel.deleteOne({ _id: id }).exec();
    }
    toPublic(user) {
        return {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            displayName: user.displayName ?? null,
            createdAt: user.createdAt,
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserService);
//# sourceMappingURL=user.service.js.map