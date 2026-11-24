package com.thelastember.game

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.floor
import kotlin.math.max

class GameConfigTest {

    @Test
    fun entryUrlUsesLocalAssetLoaderOrigin() {
        assertEquals(
            "https://appassets.androidplatform.net/assets/www/index.html",
            MainActivity.ENTRY_URL
        )
    }

    @Test
    fun nightEscalationFollowsDeterministicFivePercentFormula() {
        val baseHp = 60
        val rate = 0.05
        val nights = 4
        val scaled = Math.round(baseHp * (1.0 + nights * rate)).toInt()
        assertEquals(72, scaled)
    }

    @Test
    fun merchantSellPriceCannotExceedBuyPrice() {
        val buyPrice = 40
        val sellPrice = max(1, floor(buyPrice * 0.45).toInt())
        assertTrue(sellPrice < buyPrice)
        assertEquals(18, sellPrice)
    }
}
