from types import SimpleNamespace

from app.services.product_pricing import product_price_for_branch, product_price_payload


def product(discounts):
    return SimpleNamespace(price=1000, flash_sale_discounts=discounts)


def test_manila_flash_sale_does_not_change_pampanga_price():
    item = product({"manila": 20})

    assert product_price_for_branch(item, "Manila") == 800
    assert product_price_for_branch(item, "Pampanga") == 1000
    assert product_price_payload(item, "Pampanga")["original_price"] is None


def test_each_branch_can_have_an_independent_discount():
    item = product({"manila": 20, "pampanga": 10})

    assert product_price_for_branch(item, "manila") == 800
    assert product_price_for_branch(item, "pampanga") == 900


def test_missing_or_unknown_branch_never_receives_a_branch_sale():
    item = product({"manila": 20})

    assert product_price_for_branch(item, None) == 1000
    assert product_price_for_branch(item, "cebu") == 1000
