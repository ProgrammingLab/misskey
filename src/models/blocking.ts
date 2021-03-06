import * as mongo from 'mongodb';
import db from '../db/mongodb';
import isObjectId from '../misc/is-objectid';
import * as deepcopy from 'deepcopy';
import { pack as packUser, IUser } from './user';

const Blocking = db.get<IBlocking>('blocking');
Blocking.createIndex('blockerId');
Blocking.createIndex('blockeeId');
Blocking.createIndex(['blockerId', 'blockeeId'], { unique: true });
export default Blocking;

export type IBlocking = {
	_id: mongo.ObjectID;
	createdAt: Date;
	blockeeId: mongo.ObjectID;
	blockerId: mongo.ObjectID;
};

export const packMany = (
	blockings: (string | mongo.ObjectID | IBlocking)[],
	me?: string | mongo.ObjectID | IUser,
	options?: {
		unauthenticated?: boolean;
	}
) => {
	return Promise.all(blockings.map(x => pack(x, me, options)));
};

export const pack = (
	blocking: any,
	me?: any,
	options?: {
		unauthenticated?: boolean;
	}
) => new Promise<any>(async (resolve, reject) => {
	let _blocking: any;

	// Populate the blocking if 'blocking' is ID
	if (isObjectId(blocking)) {
		_blocking = await Blocking.findOne({
			_id: blocking
		});
	} else if (typeof blocking === 'string') {
		_blocking = await Blocking.findOne({
			_id: new mongo.ObjectID(blocking)
		});
	} else {
		_blocking = deepcopy(blocking);
	}

	// Rename _id to id
	_blocking.id = _blocking._id;
	delete _blocking._id;

	// Populate blockee
	_blocking.blockee = await packUser(_blocking.blockeeId, me, {
		detail: true,
		unauthenticated: options && options.unauthenticated
	});

	resolve(_blocking);
});
