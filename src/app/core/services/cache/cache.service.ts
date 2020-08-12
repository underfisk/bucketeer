import {Injectable, OnInit} from "@angular/core";

export type CacheKey = string | number | Symbol
export interface CacheItem {
	key: CacheKey,
	data: unknown
}
@Injectable({
	providedIn: 'root'
})
export class CacheService {
	private readonly _cache: CacheItem[]  = []
	constructor() {
		this._cache = this.hydrateLocalStorage()
	}

	clear(){
		localStorage.removeItem('cached-data')
	}

	persist() {
		localStorage.setItem('cached-data', JSON.stringify(this._cache))
	}

	private hydrateLocalStorage() {
		const stored = localStorage.getItem('cached-data')
		if (stored){
			return JSON.parse(stored)
		}
		return []
	}

	set(item: CacheItem) {
		if (!this._cache.some(e => e.key === item.key)){
			this._cache.push({ ...item })
		}
	}
	remove(key: CacheKey){
		this._cache.filter(e => e.key !== key)
	}

	has(key: CacheKey){
		return this._cache.some(e => e.key === key)
	}

	get(key: CacheKey){
		return this._cache.find(e => e.key === key)
	}

}